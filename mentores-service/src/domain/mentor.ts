/** Tipos publicos do dominio de mentores. */

export interface AreaMentoria {
  id: string;
  curso: string;
  materia: string;
}

export interface Disponibilidade {
  id: string;
  /** 0 = domingo ... 6 = sabado. */
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

export interface Mentor {
  id: string;
  nome: string;
  email: string;
  curso: string;
  periodo?: number;
  bio: string;
  ehMentor: boolean;
  ehMentorado: boolean;
  areas: AreaMentoria[];
  disponibilidades: Disponibilidade[];
  avaliacoes: Avaliacao[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface MentorResumo {
  id: string;
  nome: string;
  curso: string;
  periodo: number | null;
  bio: string;
  areas: AreaMentoria[];
  disponibilidades: Disponibilidade[];
  notas: number[];
  totalAvaliacoes: number;
}

export interface FiltroMentores {
  curso?: string;
  materia?: string;
  q?: string;
}

export interface CriarMentorInput {
  nome: string;
  email: string;
  curso?: string;
  periodo?: number;
  bio?: string;
  ehMentor?: boolean;
  ehMentorado?: boolean;
  areas?: Array<{ id?: string; curso: string; materia: string }>;
  disponibilidades?: Array<{
    id?: string;
    diaSemana: number;
    horaInicio: string;
    horaFim: string;
  }>;
}

export type AtualizarMentorInput = Partial<CriarMentorInput>;

export interface CriarAvaliacaoInput {
  sessaoId: string;
  nota: number;
  comentario?: string;
}
