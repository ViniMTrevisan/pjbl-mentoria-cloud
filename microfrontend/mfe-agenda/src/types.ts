export type StatusSessao =
  | 'SOLICITADA'
  | 'ACEITA'
  | 'RECUSADA'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type AcaoSessao = 'aceitar' | 'recusar' | 'concluir' | 'cancelar';

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

export interface ListaSessoes {
  total: number;
  itens: Sessao[];
}

export interface EntradaAvaliacao {
  sessaoId: string;
  nota: number;
  comentario?: string;
}
