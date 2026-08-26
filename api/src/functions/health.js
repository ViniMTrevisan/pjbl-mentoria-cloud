const { app } = require('@azure/functions');

// Endpoint simples para checar se a Function App esta no ar.
app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async () => ({
    status: 200,
    jsonBody: { status: 'ok', servico: 'pjbl-mentoria-api', horario: new Date().toISOString() },
  }),
});
