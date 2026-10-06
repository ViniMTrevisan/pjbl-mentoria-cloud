const { app } = require('@azure/functions');
const { mentorRepository } = require('./dependencies');
const { executarCasoHttp, lerCorpo } = require('./http');
const { alterarMentor } = require('../features/mentors/updateMentor');

app.http('mentoresAlterar', {
  methods: ['PUT', 'PATCH'],
  authLevel: 'anonymous',
  route: 'mentores-db/{id}',
  handler: async (request, context) => {
    const id = request.params.id;
    const corpo = await lerCorpo(request);
    return executarCasoHttp(context, 'alterar mentor', 'Falha ao atualizar no MongoDB', () =>
      alterarMentor({ repository: mentorRepository, id, corpo }));
  },
});
