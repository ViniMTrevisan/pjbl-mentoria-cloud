const { app } = require('@azure/functions');
const { catalogoMock } = require('./dependencies');
const { executarCasoHttp } = require('./http');
const { listarSessoes } = require('../features/sessions/listSessions');

app.http('sessoes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sessoes',
  handler: async (request, context) => {
    const status = (request.query.get('status') || '').toUpperCase();
    context.log(`GET /api/sessoes status="${status}"`);
    return executarCasoHttp(context, 'listar sessoes', 'Falha ao consultar sessoes', () =>
      listarSessoes({ catalogo: catalogoMock, status }));
  },
});
