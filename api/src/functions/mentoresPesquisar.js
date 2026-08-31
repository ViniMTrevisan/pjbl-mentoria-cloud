const { app } = require('@azure/functions');
const { obterColecao, json, paraSaida, paraObjectId, escaparRegex } = require('../db');

// AZURE FUNCTION 2/4 - PESQUISAR
// GET /api/mentores-db          -> lista tudo
// GET /api/mentores-db?q=texto  -> busca em nome, curso, bio e materias
// GET /api/mentores-db?id=<id>  -> um documento especifico
app.http('mentoresPesquisar', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mentores-db',
  handler: async (request, context) => {
    const q = (request.query.get('q') || '').trim();
    const id = (request.query.get('id') || '').trim();

    try {
      const colecao = await obterColecao();

      if (id) {
        const _id = paraObjectId(id);
        if (!_id) return json(400, { erro: 'Id invalido', id });
        const doc = await colecao.findOne({ _id });
        if (!doc) return json(404, { erro: 'Mentor nao encontrado', id });
        return json(200, { total: 1, mentores: [paraSaida(doc)] });
      }

      // Busca vazia devolve a colecao inteira, em vez de erro.
      const filtro = q
        ? (() => {
            const regex = { $regex: escaparRegex(q), $options: 'i' };
            return { $or: [{ nome: regex }, { curso: regex }, { bio: regex }, { 'areas.materia': regex }] };
          })()
        : {};

      const docs = await colecao.find(filtro).sort({ nome: 1 }).limit(100).toArray();
      context.log(`PESQUISAR q="${q}" -> ${docs.length} documento(s)`);
      return json(200, { total: docs.length, filtro: { q, id }, mentores: docs.map(paraSaida) });
    } catch (erro) {
      context.error(`Falha ao pesquisar: ${erro.message}`);
      return json(500, { erro: 'Falha ao consultar o MongoDB', detalhe: erro.message });
    }
  },
});
