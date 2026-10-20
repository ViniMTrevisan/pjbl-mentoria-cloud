import type { SessaoStatus } from './sessao';
import { STATUS_SESSAO } from './sessao';
import { ehObjeto, texto } from './texto';

export type ResultadoValidacao<T> =
  | { ok: true; valor: T }
  | { ok: false; campos: Record<string, string> };

export interface SessaoValidada {
  mentorId: string;
  mentoradoId: string;
  mentorNome: string;
  mentoradoNome: string;
  dataHora: string;
  assunto: string;
}

const MAX_NOME = 120;
const MIN_ASSUNTO = 3;
const MAX_ASSUNTO = 400;

export function parseStatus(valor: unknown): SessaoStatus | null {
  return typeof valor === 'string' && (STATUS_SESSAO as readonly string[]).includes(valor)
    ? (valor as SessaoStatus)
    : null;
}

/** Valida e normaliza a criacao de sessao (datas em ISO UTC). */
export function validarCriacao(
  dados: unknown,
  agora: string,
): ResultadoValidacao<SessaoValidada> {
  const campos: Record<string, string> = {};
  if (!ehObjeto(dados)) {
    return { ok: false, campos: { corpo: 'objeto esperado' } };
  }

  const mentorId = texto(dados.mentorId);
  const mentoradoId = texto(dados.mentoradoId);

  if (!mentorId) campos.mentorId = 'mentorId obrigatorio';
  if (!mentoradoId) campos.mentoradoId = 'mentoradoId obrigatorio';
  if (mentorId && mentoradoId && mentorId === mentoradoId) {
    campos.mentoradoId = 'deve ser diferente de mentorId';
  }

  const assunto = texto(dados.assunto) ?? '';
  if (assunto.length < MIN_ASSUNTO || assunto.length > MAX_ASSUNTO) {
    campos.assunto = `entre ${MIN_ASSUNTO} e ${MAX_ASSUNTO} caracteres`;
  }

  const dataHoraBruta = texto(dados.dataHora);
  const dataHoraMs = dataHoraBruta ? Date.parse(dataHoraBruta) : Number.NaN;
  if (!dataHoraBruta || Number.isNaN(dataHoraMs)) {
    campos.dataHora = 'data/hora invalida';
  } else if (dataHoraMs <= Date.parse(agora)) {
    campos.dataHora = 'deve ser futura';
  }

  const mentorNome = texto(dados.mentorNome) ?? mentorId ?? '';
  const mentoradoNome = texto(dados.mentoradoNome) ?? mentoradoId ?? '';
  if (!mentorNome) campos.mentorNome = 'mentorNome obrigatorio';
  if (!mentoradoNome) campos.mentoradoNome = 'mentoradoNome obrigatorio';
  if (mentorNome.length > MAX_NOME) campos.mentorNome = `maximo de ${MAX_NOME} caracteres`;
  if (mentoradoNome.length > MAX_NOME) {
    campos.mentoradoNome = `maximo de ${MAX_NOME} caracteres`;
  }

  if (Object.keys(campos).length > 0) return { ok: false, campos };

  return {
    ok: true,
    valor: {
      mentorId: mentorId as string,
      mentoradoId: mentoradoId as string,
      mentorNome,
      mentoradoNome,
      dataHora: new Date(dataHoraMs).toISOString(),
      assunto,
    },
  };
}

/** Normaliza o filtro de status; string fora do enum gera 422 no http. */
export function normalizarFiltroStatus(
  valor: unknown,
  campos: Record<string, string>,
): SessaoStatus | undefined {
  if (valor === undefined || valor === '') return undefined;
  const status = parseStatus(valor);
  if (!status) {
    campos.status = `deve ser um de ${STATUS_SESSAO.join(', ')}`;
    return undefined;
  }
  return status;
}
