import type { Mentor } from '../domain/mentor';

/**
 * Mentores iniciais da demo. u1 é apenas mentorado, por isso não aparece aqui.
 * Ids seguem o contrato (mesmo id do usuário) para o shell alternar de visão.
 */
export const mentoresSeed: Mentor[] = [
  {
    id: 'u2',
    nome: 'Ana Beatriz Moraes',
    email: 'ana.moraes@pucpr.br',
    curso: 'Engenharia de Software',
    periodo: 7,
    bio: 'Monitora de Estrutura de Dados e Cloud.',
    ehMentor: true,
    ehMentorado: false,
    areas: [
      { id: 'a1', curso: 'Engenharia de Software', materia: 'Estrutura de Dados' },
      {
        id: 'a2',
        curso: 'Engenharia de Software',
        materia: 'Arquitetura e Soluções em Cloud',
      },
    ],
    disponibilidades: [
      { id: 'd1', diaSemana: 1, horaInicio: '14:00', horaFim: '16:00' },
      { id: 'd2', diaSemana: 3, horaInicio: '19:00', horaFim: '21:00' },
    ],
    avaliacoes: [
      {
        id: 'av1',
        sessaoId: 's1',
        nota: 5,
        comentario: 'Ótima!',
        criadaEm: '2026-10-01T18:00:00.000Z',
      },
      {
        id: 'av2',
        sessaoId: 's4',
        nota: 5,
        comentario: 'Muito paciente, super recomendo.',
        criadaEm: '2026-09-12T21:00:00.000Z',
      },
      {
        id: 'av3',
        sessaoId: 's7',
        nota: 4,
        comentario: 'Ótima sessão, só faltou tempo.',
        criadaEm: '2026-08-30T19:00:00.000Z',
      },
    ],
    criadoEm: '2026-08-01T12:00:00.000Z',
    atualizadoEm: '2026-10-01T18:00:00.000Z',
  },
  {
    id: 'u3',
    nome: 'João Vitor Salles',
    email: 'joao.salles@pucpr.br',
    curso: 'Sistemas de Informação',
    periodo: 5,
    bio: 'Monitor de Banco de Dados e modelagem.',
    ehMentor: true,
    ehMentorado: true,
    areas: [
      { id: 'a3', curso: 'Sistemas de Informação', materia: 'Banco de Dados' },
      { id: 'a4', curso: 'Sistemas de Informação', materia: 'Modelagem de Sistemas' },
    ],
    disponibilidades: [
      { id: 'd3', diaSemana: 2, horaInicio: '18:00', horaFim: '20:00' },
      { id: 'd4', diaSemana: 4, horaInicio: '10:00', horaFim: '12:00' },
    ],
    avaliacoes: [
      {
        id: 'av4',
        sessaoId: 's3',
        nota: 5,
        comentario: 'Ajudou muito na normalização até a 3FN.',
        criadaEm: '2026-10-03T20:00:00.000Z',
      },
    ],
    criadoEm: '2026-08-02T13:00:00.000Z',
    atualizadoEm: '2026-10-03T20:00:00.000Z',
  },
  {
    id: 'u4',
    nome: 'Mariana Lopes',
    email: 'mariana.lopes@pucpr.br',
    curso: 'Ciência da Computação',
    periodo: 9,
    bio: 'Redes e sistemas distribuídos. Certificação AZ-900.',
    ehMentor: true,
    ehMentorado: false,
    areas: [
      { id: 'a5', curso: 'Ciência da Computação', materia: 'Redes de Computadores' },
      {
        id: 'a6',
        curso: 'Engenharia de Software',
        materia: 'Arquitetura e Soluções em Cloud',
      },
    ],
    disponibilidades: [
      { id: 'd5', diaSemana: 3, horaInicio: '08:00', horaFim: '10:00' },
      { id: 'd6', diaSemana: 6, horaInicio: '10:00', horaFim: '12:00' },
    ],
    avaliacoes: [
      {
        id: 'av5',
        sessaoId: 's2',
        nota: 4,
        comentario: 'Boa sessão, explicou subnetting com calma.',
        criadaEm: '2026-09-20T15:00:00.000Z',
      },
      {
        id: 'av6',
        sessaoId: 's5',
        nota: 5,
        comentario: 'Bem preparada.',
        criadaEm: '2026-09-02T11:00:00.000Z',
      },
    ],
    criadoEm: '2026-08-03T09:00:00.000Z',
    atualizadoEm: '2026-09-20T15:00:00.000Z',
  },
  {
    id: 'u5',
    nome: 'Fernanda Lima',
    email: 'fernanda.lima@pucpr.br',
    curso: 'Engenharia de Software',
    periodo: 8,
    bio: 'Front-end e UX. Mentora de Desenvolvimento Web.',
    ehMentor: true,
    ehMentorado: true,
    areas: [
      { id: 'a7', curso: 'Engenharia de Software', materia: 'Desenvolvimento Web' },
      { id: 'a8', curso: 'Design Digital', materia: 'Interação Humano-Computador' },
    ],
    disponibilidades: [
      { id: 'd7', diaSemana: 1, horaInicio: '09:00', horaFim: '11:00' },
      { id: 'd8', diaSemana: 5, horaInicio: '14:00', horaFim: '17:00' },
    ],
    avaliacoes: [
      {
        id: 'av7',
        sessaoId: 's6',
        nota: 5,
        comentario: 'Me salvou no projeto de front.',
        criadaEm: '2026-08-14T18:00:00.000Z',
      },
    ],
    criadoEm: '2026-08-04T14:00:00.000Z',
    atualizadoEm: '2026-08-14T18:00:00.000Z',
  },
];

/** Copia profunda para evitar que um adaptador altere os dados de seed. */
export function clonarMentoresSeed(): Mentor[] {
  return JSON.parse(JSON.stringify(mentoresSeed)) as Mentor[];
}
