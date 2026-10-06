const { app } = require('@azure/functions');
const { mentorRepository } = require('./dependencies');
const { executarCasoHttp } = require('./http');
const { excluirMentor } = require('../features/mentors/deleteMentor');

app.http('mentoresExcluir', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'mentores-db/{id}',
  handler: async (request, context) => {
    const id = request.params.id;
    return executarCasoHttp(context, 'excluir mentor', 'Falha ao excluir no MongoDB', () =>
      excluirMentor({ repository: mentorRepository, id }));
  },
});
