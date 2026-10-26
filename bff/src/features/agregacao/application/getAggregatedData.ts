import type {
  AggregatedData,
  Dependencia,
  ListaEventos,
  ListaMentores,
  ListaSessoes,
  MentorComReputacao,
  MentorResumo,
  Reputacao,
  Sessao,
  SessoesAgrupadas,
} from '../domain/agregado';
import { ErroDependencia } from '../../../shared/errors';
import type { MentoresPort } from './ports/MentoresPort';
import type { ReputacaoPort } from './ports/ReputacaoPort';
import type { SessoesPort } from './ports/SessoesPort';

export interface AgregacaoDeps {
  mentores: MentoresPort;
  sessoes: SessoesPort;
  reputacao: ReputacaoPort;
}

export interface AgregacaoOpcoes {
  /** Usuário da visão atual; vira `usuarioId` na resposta e header nas chamadas. */
  usuarioId: string;
  /** Orçamento por dependência (cada etapa tem o seu, não o total). */
  timeoutMs?: number;
  agora?: () => Date;
  /** Limite de chamadas simultâneas à Function (protege o plano de consumo). */
  limiteConcorrenciaReputacao?: number;
  /** Eventos são opcionais na agregação; nunca derrubam a resposta. */
  incluirEventos?: boolean;
}

export const TIMEOUT_PADRAO_MS = 3000;
export const CONCORRENCIA_REPUTACAO = 5;

const STATUS_ABERTOS = new Set(['SOLICITADA', 'ACEITA']);

/** Envolve a promessa em um orçamento de tempo próprio, sem depender do client. */
export function comTimeout<T>(promessa: Promise<T>, ms: number, servico: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ErroDependencia(servico, 'timeout', `Tempo esgotado ao consultar ${servico}`));
    }, ms);

    promessa.then(
      (valor) => {
        clearTimeout(timer);
        resolve(valor);
      },
      (erro: unknown) => {
        clearTimeout(timer);
        reject(
          erro instanceof ErroDependencia
            ? erro
            : new ErroDependencia(servico, 'rede', `Falha ao consultar ${servico}`),
        );
      },
    );
  });
}

/** Divide as sessões em próximas (futuras e abertas) e histórico (todo o resto). */
export function separarSessoes(sessoes: Sessao[], agora: Date): SessoesAgrupadas {
  const limite = agora.getTime();
  const proximas: Sessao[] = [];
  const historico: Sessao[] = [];

  for (const sessao of sessoes) {
    const quando = Date.parse(sessao.dataHora);
    const aberta = STATUS_ABERTOS.has(sessao.status);
    if (Number.isFinite(quando) && quando >= limite && aberta) {
      proximas.push(sessao);
    } else {
      historico.push(sessao);
    }
  }

  const porData = (a: Sessao, b: Sessao): number => {
    const delta = Date.parse(a.dataHora) - Date.parse(b.dataHora);
    if (Number.isNaN(delta) || delta === 0) return a.id.localeCompare(b.id);
    return delta;
  };

  proximas.sort(porData);
  historico.sort((a, b) => porData(b, a));

  return { proximas, historico, total: sessoes.length };
}

export function calcularMediaReputacao(mentores: MentorComReputacao[]): number | null {
  const medias = mentores
    .map((mentor) => mentor.reputacao?.media)
    .filter((media): media is number => typeof media === 'number' && Number.isFinite(media));

  if (medias.length === 0) return null;
  const soma = medias.reduce((acc, media) => acc + media, 0);
  return Math.round((soma / medias.length) * 10) / 10;
}

function normalizarMentores(entrada: ListaMentores): MentorResumo[] {
  if (!entrada || !Array.isArray(entrada.itens)) {
    throw new ErroDependencia('mentores', 'formato', 'Formato inesperado em /mentores');
  }
  return entrada.itens.map((mentor) => ({
    ...mentor,
    areas: Array.isArray(mentor.areas) ? mentor.areas : [],
    disponibilidades: Array.isArray(mentor.disponibilidades) ? mentor.disponibilidades : [],
    notas: Array.isArray(mentor.notas) ? mentor.notas : [],
    totalAvaliacoes:
      typeof mentor.totalAvaliacoes === 'number'
        ? mentor.totalAvaliacoes
        : Array.isArray(mentor.notas)
          ? mentor.notas.length
          : 0,
  }));
}

function normalizarSessoes(entrada: ListaSessoes): Sessao[] {
  if (!entrada || !Array.isArray(entrada.itens)) {
    throw new ErroDependencia('sessoes', 'formato', 'Formato inesperado em /sessoes');
  }
  return entrada.itens;
}

/** Executa `tarefa` para cada item respeitando um teto de concorrência. */
async function emParaleloLimitado<T, R>(
  itens: T[],
  limite: number,
  tarefa: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const resultados: PromiseSettledResult<R>[] = new Array(itens.length);
  let proximo = 0;

  async function operario(): Promise<void> {
    for (;;) {
      const indice = proximo++;
      if (indice >= itens.length) return;
      const item = itens[indice] as T;
      try {
        resultados[indice] = { status: 'fulfilled', value: await tarefa(item) };
      } catch (erro) {
        resultados[indice] = { status: 'rejected', reason: erro };
      }
    }
  }

  const operarios = Array.from({ length: Math.max(1, Math.min(limite, itens.length)) }, () =>
    operario(),
  );
  await Promise.all(operarios);
  return resultados;
}

/**
 * Agrega mentores, sessões e reputação para a tela inicial.
 * Falha de dependência nunca gera exceção: devolve o que foi possível, `parcial: true`
 * e o nome do serviço em `falhas`.
 */
export async function getAggregatedData(
  deps: AgregacaoDeps,
  opcoes: AgregacaoOpcoes,
): Promise<AggregatedData> {
  const timeoutMs = opcoes.timeoutMs ?? TIMEOUT_PADRAO_MS;
  const agora = (opcoes.agora ?? (() => new Date()))();
  const usuarioId = opcoes.usuarioId;
  const limite = opcoes.limiteConcorrenciaReputacao ?? CONCORRENCIA_REPUTACAO;
  const falhas: Dependencia[] = [];

  // Eventos começam junto das outras dependências e são apenas best-effort.
  const promessaEventos: Promise<ListaEventos | null> =
    opcoes.incluirEventos === false
      ? Promise.resolve(null)
      : comTimeout(deps.reputacao.listarEventos(20, usuarioId), timeoutMs, 'reputacao').catch(
          () => null,
        );

  const [resultadoMentores, resultadoSessoes] = await Promise.allSettled([
    comTimeout(deps.mentores.listar({}, usuarioId), timeoutMs, 'mentores'),
    comTimeout(deps.sessoes.listar({ usuarioId }, usuarioId), timeoutMs, 'sessoes'),
  ]);

  // ---- sessões ----
  let sessoes: SessoesAgrupadas = { proximas: [], historico: [], total: 0 };
  if (resultadoSessoes.status === 'fulfilled') {
    try {
      sessoes = separarSessoes(normalizarSessoes(resultadoSessoes.value), agora);
    } catch {
      falhas.push('sessoes');
    }
  } else {
    falhas.push('sessoes');
  }

  // ---- mentores + reputação ----
  let mentores: MentorComReputacao[] = [];
  if (resultadoMentores.status === 'fulfilled') {
    let base: MentorResumo[] = [];
    try {
      base = normalizarMentores(resultadoMentores.value);
    } catch {
      falhas.push('mentores');
    }

    if (base.length > 0) {
      const calculos = await emParaleloLimitado(base, limite, (mentor) =>
        comTimeout(deps.reputacao.calcular(mentor.notas, usuarioId), timeoutMs, 'reputacao'),
      );

      let falhouReputacao = false;
      mentores = base.map((mentor, indice) => {
        const calculo = calculos[indice];
        const reputacao: Reputacao | null =
          calculo && calculo.status === 'fulfilled' ? calculo.value : null;
        if (!reputacao) falhouReputacao = true;
        return { ...mentor, reputacao };
      });
      if (falhouReputacao) falhas.push('reputacao');
    }
  } else {
    falhas.push('mentores');
  }

  // ---- eventos (best-effort, não entra em `falhas`) ----
  let eventos: ListaEventos['itens'] = [];
  if (opcoes.incluirEventos !== false) {
    const recebidos = await promessaEventos;
    if (recebidos && Array.isArray(recebidos.itens)) eventos = recebidos.itens;
  }

  const resumo = {
    totalMentores: mentores.length,
    totalSessoes: sessoes.total,
    sessoesPendentes: [...sessoes.proximas, ...sessoes.historico].filter(
      (sessao) => sessao.status === 'SOLICITADA',
    ).length,
    mediaReputacao: calcularMediaReputacao(mentores),
  };

  return {
    geradoEm: agora.toISOString(),
    usuarioId,
    mentores,
    sessoes,
    resumo,
    eventos,
    parcial: falhas.length > 0,
    falhas: ordenarFalhas(falhas),
  };
}

const ORDEM_FALHAS: Dependencia[] = ['mentores', 'sessoes', 'reputacao'];

/** Ordem estável e previsível para o consumidor, sem duplicatas. */
function ordenarFalhas(falhas: Dependencia[]): Dependencia[] {
  return ORDEM_FALHAS.filter((nome) => falhas.includes(nome));
}
