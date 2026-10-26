/**
 * DTOs compartilhados entre HTTP, casos de uso e adaptadores.
 * Sem lógica de negócio: apenas a forma dos dados do contrato da Entrega 3.
 */

export type StatusSessao =
  | 'SOLICITADA'
  | 'ACEITA'
  | 'RECUSADA'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type AcaoSessao = 'aceitar' | 'recusar' | 'concluir' | 'cancelar';

export interface Area {
  id: string;
  curso: string;
  materia: string;
}

export interface Disponibilidade {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}

export interface Avaliacao {
  id: string;
  sessaoId: string;
  nota: number;
  comentario?: string;
  criadaEm: string;
}

/** `notas` são apenas os números, usados no cálculo de reputação em lote. */
export interface MentorResumo {
  id: string;
  nome: string;
  email?: string;
  curso: string;
  periodo: number | null;
  bio: string;
  areas: Area[];
  disponibilidades: Disponibilidade[];
  notas: number[];
  totalAvaliacoes: number;
}

export interface Reputacao {
  media: number | null;
  total: number;
  distribuicao?: Record<string, number>;
  selo?: string;
  semAvaliacoes: boolean;
}

export interface MentorComReputacao extends MentorResumo {
  reputacao: Reputacao | null;
}

export interface Sessao {
  id: string;
  mentorId: string;
  mentoradoId: string;
  mentorNome: string;
  mentoradoNome: string;
  dataHora: string;
  assunto: string;
  status: StatusSessao;
  criadaEm: string;
  atualizadaEm: string;
}

export interface Evento {
  id: string;
  type: string;
  source: string;
  time: string;
  data?: unknown;
}

export interface ListaMentores {
  total: number;
  itens: MentorResumo[];
}

export interface ListaSessoes {
  total: number;
  itens: Sessao[];
}

export interface ListaEventos {
  total: number;
  itens: Evento[];
}

export interface SessoesAgrupadas {
  proximas: Sessao[];
  historico: Sessao[];
  total: number;
}

export interface ResumoAgregado {
  totalMentores: number;
  totalSessoes: number;
  sessoesPendentes: number;
  mediaReputacao: number | null;
}

/** Nomes aceitos em `falhas`; são exatamente as dependências da agregação. */
export type Dependencia = 'mentores' | 'sessoes' | 'reputacao';

export interface AggregatedData {
  geradoEm: string;
  usuarioId: string;
  mentores: MentorComReputacao[];
  sessoes: SessoesAgrupadas;
  resumo: ResumoAgregado;
  eventos: Evento[];
  parcial: boolean;
  falhas: Dependencia[];
}

export type EstadoDependencia = 'ok' | 'fora';

export interface Saude {
  status: 'ok' | 'degradado';
  dependencias: {
    mentores: EstadoDependencia;
    sessoes: EstadoDependencia;
    function: EstadoDependencia;
  };
}
