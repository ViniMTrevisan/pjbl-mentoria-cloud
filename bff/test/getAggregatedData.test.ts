import { describe, expect, it } from 'vitest';
import type {
  ListaMentores,
  ListaSessoes,
  MentorResumo,
  Reputacao,
  Sessao,
} from '../src/features/agregacao/domain/agregado';
import type { MentoresPort } from '../src/features/agregacao/application/ports/MentoresPort';
import type { SessoesPort } from '../src/features/agregacao/application/ports/SessoesPort';
import type { ReputacaoPort } from '../src/features/agregacao/application/ports/ReputacaoPort';
import {
  getAggregatedData,
  separarSessoes,
  type AgregacaoDeps,
} from '../src/features/agregacao/application/getAggregatedData';

const AGORA = new Date('2026-10-20T18:00:00.000Z');

function mentor(id: string, nome: string, notas: number[]): MentorResumo {
  return {
    id,
    nome,
    email: `${id}@pucpr.br`,
    curso: 'Engenharia de Software',
    periodo: 7,
    bio: 'Monitor',
    areas: [{ id: `a-${id}`, curso: 'Engenharia de Software', materia: 'Estrutura de Dados' }],
    disponibilidades: [{ id: `d-${id}`, diaSemana: 1, horaInicio: '14:00', horaFim: '16:00' }],
    notas,
    totalAvaliacoes: notas.length,
  };
}

function sessao(parcial: Partial<Sessao> & { id: string; dataHora: string }): Sessao {
  return {
    mentorId: 'u2',
    mentoradoId: 'u1',
    mentorNome: 'Ana Beatriz Moraes',
    mentoradoNome: 'Bruno Calouro',
    assunto: 'Dúvida',
    status: 'SOLICITADA',
    criadaEm: '2026-10-19T12:00:00.000Z',
    atualizadaEm: '2026-10-19T12:00:00.000Z',
    ...parcial,
  };
}

function reputacaoDe(notas: number[]): Reputacao {
  const media = notas.length
    ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
    : null;
  return { media, total: notas.length, semAvaliacoes: notas.length === 0, selo: 'confiavel' };
}

interface Cenario {
  mentores?: MentoresPort;
  sessoes?: SessoesPort;
  reputacao?: ReputacaoPort;
}

function montarDeps(cenario: Cenario = {}): AgregacaoDeps {
  const listaMentores: ListaMentores = {
    total: 2,
    itens: [mentor('u2', 'Ana Beatriz Moraes', [5, 4, 5]), mentor('u3', 'João Vitor Salles', [3])],
  };
  const listaSessoes: ListaSessoes = {
    total: 4,
    itens: [
      sessao({ id: 's-futura-2', dataHora: '2026-10-25T17:00:00.000Z', status: 'ACEITA' }),
      sessao({ id: 's-futura-1', dataHora: '2026-10-22T17:00:00.000Z', status: 'SOLICITADA' }),
      sessao({ id: 's-passada', dataHora: '2026-10-10T17:00:00.000Z', status: 'CONCLUIDA' }),
      sessao({ id: 's-recusada', dataHora: '2026-10-26T17:00:00.000Z', status: 'RECUSADA' }),
    ],
  };

  return {
    mentores: cenario.mentores ?? { listar: async () => listaMentores },
    sessoes: cenario.sessoes ?? { listar: async () => listaSessoes },
    reputacao:
      cenario.reputacao ??
      ({
        calcular: async (notas: number[]) => reputacaoDe(notas),
        listarEventos: async () => ({ total: 0, itens: [] }),
      } satisfies ReputacaoPort),
  };
}

const aguardar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('getAggregatedData', () => {
  it('agrega mentores, sessões e reputação no caminho feliz', async () => {
    const dados = await getAggregatedData(montarDeps(), {
      usuarioId: 'u1',
      agora: () => AGORA,
    });

    expect(dados.parcial).toBe(false);
    expect(dados.falhas).toEqual([]);
    expect(dados.usuarioId).toBe('u1');
    expect(dados.geradoEm).toBe(AGORA.toISOString());
    expect(dados.mentores).toHaveLength(2);
    expect(dados.mentores[0]?.reputacao?.media).toBe(4.7);
    expect(dados.mentores[1]?.reputacao?.semAvaliacoes).toBe(false);

    // próximas: futuras e abertas, ascendentes
    expect(dados.sessoes.proximas.map((s) => s.id)).toEqual(['s-futura-1', 's-futura-2']);
    // histórico: passadas e encerradas, descendentes
    expect(dados.sessoes.historico.map((s) => s.id)).toEqual(['s-recusada', 's-passada']);
    expect(dados.sessoes.total).toBe(4);

    expect(dados.resumo).toEqual({
      totalMentores: 2,
      totalSessoes: 4,
      sessoesPendentes: 1,
      mediaReputacao: 3.9,
    });
  });

  it('devolve parcial quando o serviço de sessões está fora', async () => {
    const deps = montarDeps({
      sessoes: {
        listar: async () => {
          throw new Error('ECONNREFUSED');
        },
      },
    });

    const dados = await getAggregatedData(deps, { usuarioId: 'u1', agora: () => AGORA });

    expect(dados.parcial).toBe(true);
    expect(dados.falhas).toEqual(['sessoes']);
    expect(dados.sessoes).toEqual({ proximas: [], historico: [], total: 0 });
    expect(dados.mentores).toHaveLength(2);
    expect(dados.resumo.totalSessoes).toBe(0);
    expect(dados.resumo.mediaReputacao).toBe(3.9);
  });

  it('lida com listas vazias sem inventar média', async () => {
    const deps: AgregacaoDeps = {
      mentores: { listar: async () => ({ total: 0, itens: [] }) },
      sessoes: { listar: async () => ({ total: 0, itens: [] }) },
      reputacao: {
        calcular: async () => reputacaoDe([]),
        listarEventos: async () => ({ total: 0, itens: [] }),
      },
    };

    const dados = await getAggregatedData(deps, { usuarioId: 'u9', agora: () => AGORA });

    expect(dados.mentores).toEqual([]);
    expect(dados.sessoes.proximas).toEqual([]);
    expect(dados.resumo).toEqual({
      totalMentores: 0,
      totalSessoes: 0,
      sessoesPendentes: 0,
      mediaReputacao: null,
    });
    expect(dados.parcial).toBe(false);
  });

  it('corta a dependência lenta no orçamento e marca o serviço', async () => {
    const deps = montarDeps({
      sessoes: { listar: () => new Promise<ListaSessoes>(() => undefined) },
    });

    const inicio = Date.now();
    const dados = await getAggregatedData(deps, {
      usuarioId: 'u1',
      agora: () => AGORA,
      timeoutMs: 30,
      incluirEventos: false,
    });
    const decorrido = Date.now() - inicio;

    expect(decorrido).toBeLessThan(1000);
    expect(dados.parcial).toBe(true);
    expect(dados.falhas).toEqual(['sessoes']);
  });

  it('mantém os mentores com reputação nula quando a Function falha', async () => {
    const deps = montarDeps({
      reputacao: {
        calcular: async () => {
          throw new Error('function fora');
        },
        listarEventos: async () => ({ total: 0, itens: [] }),
      },
    });

    const dados = await getAggregatedData(deps, { usuarioId: 'u1', agora: () => AGORA });

    expect(dados.parcial).toBe(true);
    expect(dados.falhas).toEqual(['reputacao']);
    expect(dados.mentores.every((m) => m.reputacao === null)).toBe(true);
    expect(dados.resumo.mediaReputacao).toBeNull();
  });

  it('não chama a Function de reputação quando mentores está fora', async () => {
    let chamou = false;
    const deps = montarDeps({
      mentores: {
        listar: async () => {
          throw new Error('mongo fora');
        },
      },
      reputacao: {
        calcular: async () => {
          chamou = true;
          return reputacaoDe([]);
        },
        listarEventos: async () => ({ total: 0, itens: [] }),
      },
    });

    const dados = await getAggregatedData(deps, { usuarioId: 'u1', agora: () => AGORA });

    expect(chamou).toBe(false);
    expect(dados.falhas).toEqual(['mentores']);
    expect(dados.mentores).toEqual([]);
    expect(dados.resumo.totalMentores).toBe(0);
  });

  it('não bloqueia a resposta quando o sink de eventos falha', async () => {
    const deps = montarDeps({
      reputacao: {
        calcular: async (notas: number[]) => reputacaoDe(notas),
        listarEventos: async () => {
          throw new Error('sink fora');
        },
      },
    });

    const dados = await getAggregatedData(deps, { usuarioId: 'u1', agora: () => AGORA });

    expect(dados.eventos).toEqual([]);
    expect(dados.parcial).toBe(false);
    expect(dados.falhas).toEqual([]);
  });

  it('respeita o limite de concorrência da reputação', async () => {
    let emVoo = 0;
    let pico = 0;
    const deps = montarDeps({
      mentores: {
        listar: async () => ({
          total: 12,
          itens: Array.from({ length: 12 }, (_, i) => mentor(`u${i}`, `Mentor ${i}`, [5])),
        }),
      },
      reputacao: {
        calcular: async (notas: number[]) => {
          emVoo += 1;
          pico = Math.max(pico, emVoo);
          await aguardar(5);
          emVoo -= 1;
          return reputacaoDe(notas);
        },
        listarEventos: async () => ({ total: 0, itens: [] }),
      },
    });

    await getAggregatedData(deps, { usuarioId: 'u1', agora: () => AGORA, incluirEventos: false });

    expect(pico).toBeLessThanOrEqual(5);
  });
});

describe('separarSessoes', () => {
  it('considera a data de corte inclusiva e mantém sessão aberta futura em próximas', () => {
    const resultado = separarSessoes(
      [
        sessao({ id: 'agora', dataHora: AGORA.toISOString(), status: 'ACEITA' }),
        sessao({ id: 'passada-aberta', dataHora: '2026-10-19T18:00:00.000Z' }),
        sessao({ id: 'futura-cancelada', dataHora: '2026-10-21T18:00:00.000Z', status: 'CANCELADA' }),
      ],
      AGORA,
    );

    expect(resultado.proximas.map((s) => s.id)).toEqual(['agora']);
    expect(resultado.historico.map((s) => s.id)).toEqual(['futura-cancelada', 'passada-aberta']);
  });
});
