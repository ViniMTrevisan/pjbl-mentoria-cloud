const { app } = require('@azure/functions');
const { mentorRepository } = require('./dependencies');
const { executarCasoHttp } = require('./http');
const { pesquisarMentores } = require('../features/mentors/searchMentors');

app.http('mentoresPesquisar', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mentores-db',
  handler: async (request, context) => {
    const consulta = (request.query.get('q') || '').trim();
    const id = (request.query.get('id') || '').trim();
    context.log(`PESQUISAR q="${consulta}"`);
    return executarCasoHttp(context, 'pesquisar mentores', 'Falha ao consultar o MongoDB', () =>
      pesquisarMentores({ repository: mentorRepository, consulta, id }));
  },
});
