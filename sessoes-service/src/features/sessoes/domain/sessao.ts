/** Tipos publicos do dominio de sessoes. */

export const STATUS_SESSAO = [
  'SOLICITADA',
  'ACEITA',
  'RECUSADA',
  'CONCLUIDA',
  'CANCELADA',
] as const;

export type SessaoStatus = (typeof STATUS_SESSAO)[number];

export const ACOES_SESSAO = ['aceitar', 'recusar', 'concluir', 'cancelar'] as const;

export type SessaoAcao = (typeof ACOES_SESSAO)[number];

export const TIPOS_EVENTO = [
  'SessaoSolicitada',
  'SessaoAceita',
  'SessaoRecusada',
  'SessaoCancelada',
  'SessaoConcluida',
] as const;

export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export interface Sessao {
  id: string;
  mentorId: string;
  mentoradoId: string;
  mentorNome: string;
  mentoradoNome: string;
  dataHora: string;
  assunto: string;
  status: SessaoStatus;
  criadaEm: string;
  atualizadaEm: string;
}

export interface CriarSessaoInput {
  mentorId: string;
  mentoradoId: string;
  mentorNome?: string;
  mentoradoNome?: string;
  dataHora: string;
  assunto: string;
}

export interface FiltroSessoes {
  usuarioId?: string;
  status?: SessaoStatus;
}

/** Evento CloudEvents-like montado no dominio e persistido no outbox. */
export interface EventoDominio {
  id: string;
  type: TipoEvento;
  source: string;
  time: string;
  data: Record<string, unknown>;
}

/** Linha pendente do outbox, ja serializada para envio. */
export interface EventoPendente {
  id: string;
  tipo: TipoEvento;
  sessaoId: string;
  payload: string;
  criadoEm: string;
  publicadoEm: string | null;
}
