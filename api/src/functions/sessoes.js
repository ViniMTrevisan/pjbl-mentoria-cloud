const { app } = require('@azure/functions');
const { sessoes } = require('../data/mock');

// RF9 - GET /api/sessoes?status=
// Lista as sessoes do usuario logado (mock: usuario fixo "Vinicius Trevisan").
app.http('sessoes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sessoes',
  handler: async (request, context) => {
    const status = (request.query.get('status') || '').toUpperCase();
    context.log(`GET /api/sessoes status="${status}"`);

    const lista = sessoes
      .filter((s) => !status || s.status === status)
      .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

    const agora = new Date();
    return json(200, {
      total: lista.length,
      proximas: lista.filter((s) => new Date(s.dataHora) >= agora && ['SOLICITADA', 'ACEITA'].includes(s.status)),
      historico: lista.filter((s) => new Date(s.dataHora) < agora || ['CONCLUIDA', 'CANCELADA', 'RECUSADA'].includes(s.status)),
      sessoes: lista,
    });
  },
});

function json(status, body) {
  return { status, jsonBody: body, headers: { 'Content-Type': 'application/json; charset=utf-8' } };
}
