const { app } = require('@azure/functions');
const { mentorRepository } = require('./dependencies');
const { executarCasoHttp, lerCorpo } = require('./http');
const { criarMentor } = require('../features/mentors/createMentor');

app.http('mentoresInserir', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'mentores-db',
  handler: async (request, context) => {
    const corpo = await lerCorpo(request);
    return executarCasoHttp(context, 'inserir mentor', 'Falha ao gravar no MongoDB', () =>
      criarMentor({ repository: mentorRepository, corpo }));
  },
});
