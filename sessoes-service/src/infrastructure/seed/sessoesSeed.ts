import type { Sessao } from '../../domain/sessao';

/** Sessoes iniciais da demo: uma por estado relevante, sempre com u1 como mentorado. */
export const sessoesSeed: Sessao[] = [
  {
    id: 's1',
    mentorId: 'u2',
    mentoradoId: 'u1',
    mentorNome: 'Ana Beatriz Moraes',
    mentoradoNome: 'Bruno Calouro',
    dataHora: '2026-10-22T17:00:00.000Z',
    assunto: 'Dúvida em árvores binárias',
    status: 'SOLICITADA',
    criadaEm: '2026-10-20T12:00:00.000Z',
    atualizadaEm: '2026-10-20T12:00:00.000Z',
  },
  {
    id: 's2',
    mentorId: 'u4',
    mentoradoId: 'u1',
    mentorNome: 'Mariana Lopes',
    mentoradoNome: 'Bruno Calouro',
    dataHora: '2026-10-24T14:00:00.000Z',
    assunto: 'Revisão de subnetting para a prova',
    status: 'ACEITA',
    criadaEm: '2026-10-18T09:00:00.000Z',
    atualizadaEm: '2026-10-19T10:00:00.000Z',
  },
  {
    id: 's3',
    mentorId: 'u3',
    mentoradoId: 'u1',
    mentorNome: 'João Vitor Salles',
    mentoradoNome: 'Bruno Calouro',
    dataHora: '2026-10-10T18:00:00.000Z',
    assunto: 'Normalização até a 3FN',
    status: 'CONCLUIDA',
    criadaEm: '2026-10-05T12:00:00.000Z',
    atualizadaEm: '2026-10-10T19:00:00.000Z',
  },
  {
    id: 's4',
    mentorId: 'u5',
    mentoradoId: 'u1',
    mentorNome: 'Fernanda Lima',
    mentoradoNome: 'Bruno Calouro',
    dataHora: '2026-10-12T16:00:00.000Z',
    assunto: 'Dúvidas de React e estado',
    status: 'RECUSADA',
    criadaEm: '2026-10-08T14:00:00.000Z',
    atualizadaEm: '2026-10-09T08:00:00.000Z',
  },
];

export function clonarSessoesSeed(): Sessao[] {
  return JSON.parse(JSON.stringify(sessoesSeed)) as Sessao[];
}
