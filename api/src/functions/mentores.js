const { app } = require('@azure/functions');
const { catalogoMock } = require('./dependencies');
const { executarCasoHttp } = require('./http');
const { listarMentoresPublicos } = require('../features/mentors/listPublicMentors');
const { obterMentorPublico } = require('../features/mentors/getPublicMentor');

app.http('mentores', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mentores',
  handler: async (request, context) => {
    const filtros = {
      curso: request.query.get('curso') || '',
      materia: request.query.get('materia') || '',
      q: request.query.get('q') || '',
    };
    context.log(`GET /api/mentores curso="${filtros.curso}" materia="${filtros.materia}" q="${filtros.q}"`);
    return executarCasoHttp(context, 'listar mentores', 'Falha ao consultar mentores', () =>
      listarMentoresPublicos({ catalogo: catalogoMock, filtros }));
  },
});

app.http('mentorPorId', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mentores/{id}',
  handler: async (request, context) => {
    const { id } = request.params;
    context.log(`GET /api/mentores/${id}`);
    return executarCasoHttp(context, 'buscar mentor', 'Falha ao consultar mentor', () =>
      obterMentorPublico({ catalogo: catalogoMock, id }));
  },
});
