const { app } = require('@azure/functions');
const { mentores, calcularReputacao } = require('../data/mock');

const json = (status, body) => ({
  status,
  jsonBody: body,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

const contem = (texto, termo) => (texto || '').toLowerCase().includes(termo.toLowerCase());

// RF5 - GET /api/mentores?curso=&materia=&q=
// Retorna apenas mentores com ao menos uma area cadastrada, ordenados por
// reputacao decrescente (mentor sem avaliacao vai para o fim da lista).
app.http('mentores', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mentores',
  handler: async (request, context) => {
    const curso = request.query.get('curso') || '';
    const materia = request.query.get('materia') || '';
    const q = request.query.get('q') || '';

    context.log(`GET /api/mentores curso="${curso}" materia="${materia}" q="${q}"`);

    const resultado = mentores
      .filter((m) => m.ehMentor && m.areas.length > 0)
      .filter((m) => !curso || m.areas.some((a) => contem(a.curso, curso)) || contem(m.curso, curso))
      .filter((m) => !materia || m.areas.some((a) => contem(a.materia, materia)))
      .filter((m) => !q || contem(m.nome, q) || contem(m.bio, q) || m.areas.some((a) => contem(a.materia, q)))
      .map((m) => ({
        id: m.id,
        nome: m.nome,
        curso: m.curso,
        periodo: m.periodo,
        bio: m.bio,
        areas: m.areas,
        reputacao: calcularReputacao(m),
      }))
      .sort((a, b) => (b.reputacao.media ?? -1) - (a.reputacao.media ?? -1));

    return json(200, { total: resultado.length, filtros: { curso, materia, q }, mentores: resultado });
  },
});

// RF5 + RF11 - GET /api/mentores/{id}
app.http('mentorPorId', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mentores/{id}',
  handler: async (request, context) => {
    const { id } = request.params;
    context.log(`GET /api/mentores/${id}`);

    const mentor = mentores.find((m) => m.id === id);
    if (!mentor) {
      return json(404, { erro: 'Mentor nao encontrado', id });
    }

    return json(200, {
      id: mentor.id,
      nome: mentor.nome,
      email: mentor.email,
      curso: mentor.curso,
      periodo: mentor.periodo,
      bio: mentor.bio,
      areas: mentor.areas,
      disponibilidades: mentor.disponibilidades,
      avaliacoes: mentor.avaliacoes,
      reputacao: calcularReputacao(mentor),
    });
  },
});
