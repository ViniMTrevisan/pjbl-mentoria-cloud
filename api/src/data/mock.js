// Dados mock da plataforma de mentoria (MVP academico - sem banco de dados).
// Espelham o modelo de dados descrito no PRD (Usuario / AreaMentoria /
// Disponibilidade / Sessao / Avaliacao).

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

const mentores = [
  {
    id: 'u1',
    nome: 'Ana Beatriz Moraes',
    email: 'ana.moraes@pucpr.edu.br',
    curso: 'Engenharia de Software',
    periodo: 7,
    bio: 'Foco em backend e cloud. Ja fui monitora de Estrutura de Dados por 3 semestres.',
    ehMentor: true,
    ehMentorado: false,
    areas: [
      { id: 'a1', curso: 'Engenharia de Software', materia: 'Estrutura de Dados' },
      { id: 'a2', curso: 'Engenharia de Software', materia: 'Arquitetura e Solucoes em Cloud' },
    ],
    disponibilidades: [
      { id: 'd1', diaSemana: 1, horaInicio: '14:00', horaFim: '16:00' },
      { id: 'd2', diaSemana: 3, horaInicio: '19:00', horaFim: '21:00' },
    ],
    avaliacoes: [
      { nota: 5, comentario: 'Explicou arvore AVL melhor que a aula inteira.', autor: 'Calouro do 1o periodo' },
      { nota: 5, comentario: 'Muito paciente, super recomendo.', autor: 'Lucas M.' },
      { nota: 4, comentario: 'Otima sessao, so faltou tempo.', autor: 'Rafaela S.' },
    ],
  },
  {
    id: 'u2',
    nome: 'Carlos Eduardo Tanaka',
    email: 'carlos.tanaka@pucpr.edu.br',
    curso: 'Ciencia da Computacao',
    periodo: 6,
    bio: 'Gosto de matematica aplicada. Ajudo em Calculo e Algebra Linear.',
    ehMentor: true,
    ehMentorado: true,
    areas: [
      { id: 'a3', curso: 'Ciencia da Computacao', materia: 'Calculo Diferencial e Integral' },
      { id: 'a4', curso: 'Ciencia da Computacao', materia: 'Algebra Linear' },
    ],
    disponibilidades: [
      { id: 'd3', diaSemana: 2, horaInicio: '10:00', horaFim: '12:00' },
      { id: 'd4', diaSemana: 5, horaInicio: '16:00', horaFim: '18:00' },
    ],
    avaliacoes: [
      { nota: 4, comentario: 'Resolveu minhas duvidas de integral por partes.', autor: 'Bruno C.' },
      { nota: 5, comentario: 'Didatico demais.', autor: 'Marina L.' },
    ],
  },
  {
    id: 'u3',
    nome: 'Fernanda Ribeiro Costa',
    email: 'fernanda.costa@pucpr.edu.br',
    curso: 'Engenharia de Software',
    periodo: 8,
    bio: 'Front-end e UX. Trabalho com React ha 2 anos em estagio.',
    ehMentor: true,
    ehMentorado: false,
    areas: [
      { id: 'a5', curso: 'Engenharia de Software', materia: 'Desenvolvimento Web' },
      { id: 'a6', curso: 'Design Digital', materia: 'Interacao Humano-Computador' },
    ],
    disponibilidades: [
      { id: 'd5', diaSemana: 1, horaInicio: '09:00', horaFim: '11:00' },
      { id: 'd6', diaSemana: 4, horaInicio: '14:00', horaFim: '17:00' },
    ],
    avaliacoes: [
      { nota: 5, comentario: 'Me salvou no projeto de front.', autor: 'Pedro H.' },
    ],
  },
  {
    id: 'u4',
    nome: 'Joao Vitor Salles',
    email: 'joao.salles@pucpr.edu.br',
    curso: 'Sistemas de Informacao',
    periodo: 5,
    bio: 'Banco de dados e modelagem. Monitor de BD I.',
    ehMentor: true,
    ehMentorado: true,
    areas: [
      { id: 'a7', curso: 'Sistemas de Informacao', materia: 'Banco de Dados' },
      { id: 'a8', curso: 'Sistemas de Informacao', materia: 'Modelagem de Sistemas' },
    ],
    disponibilidades: [
      { id: 'd7', diaSemana: 2, horaInicio: '18:00', horaFim: '20:00' },
    ],
    avaliacoes: [],
  },
  {
    id: 'u5',
    nome: 'Mariana Alves Pinto',
    email: 'mariana.pinto@pucpr.edu.br',
    curso: 'Ciencia da Computacao',
    periodo: 9,
    bio: 'Redes e sistemas distribuidos. Certificacao AZ-900.',
    ehMentor: true,
    ehMentorado: false,
    areas: [
      { id: 'a9', curso: 'Ciencia da Computacao', materia: 'Redes de Computadores' },
      { id: 'a10', curso: 'Engenharia de Software', materia: 'Arquitetura e Solucoes em Cloud' },
    ],
    disponibilidades: [
      { id: 'd8', diaSemana: 3, horaInicio: '08:00', horaFim: '10:00' },
      { id: 'd9', diaSemana: 6, horaInicio: '10:00', horaFim: '12:00' },
    ],
    avaliacoes: [
      { nota: 5, comentario: 'Explicou subnetting de um jeito que finalmente entendi.', autor: 'Gabriel F.' },
      { nota: 3, comentario: 'Boa sessao, mas atrasou 15 minutos.', autor: 'Isabela R.' },
      { nota: 4, comentario: 'Bem preparada.', autor: 'Thiago N.' },
      { nota: 5, comentario: 'Top.', autor: 'Camila V.' },
    ],
  },
];

const sessoes = [
  {
    id: 's1',
    mentorId: 'u1',
    mentorNome: 'Ana Beatriz Moraes',
    mentoradoId: 'u9',
    mentoradoNome: 'Vinicius Trevisan',
    dataHora: '2026-09-02T14:00:00-03:00',
    assunto: 'Duvidas de arvore binaria de busca',
    status: 'ACEITA',
  },
  {
    id: 's2',
    mentorId: 'u5',
    mentorNome: 'Mariana Alves Pinto',
    mentoradoId: 'u9',
    mentoradoNome: 'Vinicius Trevisan',
    dataHora: '2026-09-04T08:00:00-03:00',
    assunto: 'Revisao de subnetting para a prova',
    status: 'SOLICITADA',
  },
  {
    id: 's3',
    mentorId: 'u3',
    mentorNome: 'Fernanda Ribeiro Costa',
    mentoradoId: 'u9',
    mentoradoNome: 'Vinicius Trevisan',
    dataHora: '2026-08-14T14:00:00-03:00',
    assunto: 'Componentes React e estado',
    status: 'CONCLUIDA',
    avaliacao: { nota: 5, comentario: 'Me salvou no projeto de front.' },
  },
  {
    id: 's4',
    mentorId: 'u2',
    mentorNome: 'Carlos Eduardo Tanaka',
    mentoradoId: 'u9',
    mentoradoNome: 'Vinicius Trevisan',
    dataHora: '2026-08-08T10:00:00-03:00',
    assunto: 'Integral por partes',
    status: 'CONCLUIDA',
    avaliacao: { nota: 4, comentario: 'Resolveu minhas duvidas de integral por partes.' },
  },
  {
    id: 's5',
    mentorId: 'u4',
    mentorNome: 'Joao Vitor Salles',
    mentoradoId: 'u9',
    mentoradoNome: 'Vinicius Trevisan',
    dataHora: '2026-07-29T18:00:00-03:00',
    assunto: 'Normalizacao ate 3FN',
    status: 'CANCELADA',
  },
  {
    id: 's6',
    mentorId: 'u1',
    mentorNome: 'Ana Beatriz Moraes',
    mentoradoId: 'u9',
    mentoradoNome: 'Vinicius Trevisan',
    dataHora: '2026-07-21T19:00:00-03:00',
    assunto: 'Complexidade de algoritmos',
    status: 'RECUSADA',
  },
];

// RF11 - reputacao = media aritmetica das notas, 1 casa decimal.
// Mentor sem avaliacao NAO exibe 0.0 (regra do PRD).
function calcularReputacao(mentor) {
  const total = mentor.avaliacoes.length;
  if (total === 0) return { media: null, total: 0 };
  const soma = mentor.avaliacoes.reduce((acc, a) => acc + a.nota, 0);
  return { media: Math.round((soma / total) * 10) / 10, total };
}

module.exports = { mentores, sessoes, calcularReputacao, DIAS_SEMANA };
