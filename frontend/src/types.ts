export type Area = { id: string; curso: string; materia: string };
export type Disponibilidade = { id: string; diaSemana: number; horaInicio: string; horaFim: string };
export type Avaliacao = { nota: number; comentario: string; autor: string };
export type Reputacao = { media: number | null; total: number };

export type Mentor = {
  id: string;
  nome: string;
  curso: string;
  periodo: number;
  bio: string;
  areas: Area[];
  reputacao: Reputacao;
};

export type MentorDetalhado = Mentor & {
  email: string;
  disponibilidades: Disponibilidade[];
  avaliacoes: Avaliacao[];
};

export type StatusSessao = 'SOLICITADA' | 'ACEITA' | 'RECUSADA' | 'CONCLUIDA' | 'CANCELADA';

export type Sessao = {
  id: string;
  mentorId: string;
  mentorNome: string;
  mentoradoId: string;
  mentoradoNome: string;
  dataHora: string;
  assunto: string;
  status: StatusSessao;
  avaliacao?: { nota: number; comentario: string };
};

export type RespostaMentores = { total: number; mentores: Mentor[] };
export type RespostaSessoes = { total: number; proximas: Sessao[]; historico: Sessao[]; sessoes: Sessao[] };

/* ---------- CRUD MongoDB (4 Azure Functions) ---------- */

export type MentorDb = {
  id: string;
  nome: string;
  curso: string;
  periodo: number | null;
  bio: string;
  areas: Area[];
  criadoEm?: string;
  atualizadoEm?: string;
};

export type EntradaMentor = {
  nome: string;
  curso: string;
  periodo: number | null;
  bio: string;
  areas: Area[];
};

export type RespostaPesquisa = { total: number; mentores: MentorDb[] };
export type RespostaEscrita = { mensagem: string; mentor: MentorDb };
