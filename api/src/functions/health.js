const { app } = require('@azure/functions');
const { json } = require('./http');

// Endpoint simples para checar se a Function App esta no ar.
app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async () => json(200, {
    status: 'ok',
    servico: 'pjbl-mentoria-api',
    horario: new Date().toISOString(),
  }),
});
