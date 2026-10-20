export type StatusSessao =
  | 'SOLICITADA'
  | 'ACEITA'
  | 'RECUSADA'
  | 'CONCLUIDA'
  | 'CANCELADA';

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

export interface Reputacao {
  media: number | null;
  total: number;
  selo?: string;
  semAvaliacoes: boolean;
}

export interface Mentor {
  id: string;
  nome: string;
  curso: string;
  periodo: number | null;
  bio: string;
  areas: Area[];
  disponibilidades: Disponibilidade[];
  reputacao: Reputacao | null;
  totalAvaliacoes: number;
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
}

export interface Agregado {
  usuarioId: string;
  mentores: Mentor[];
  parcial: boolean;
  falhas: string[];
}

export interface EntradaSessao {
  mentorId: string;
  mentoradoId: string;
  mentorNome: string;
  mentoradoNome: string;
  dataHora: string;
  assunto: string;
}
