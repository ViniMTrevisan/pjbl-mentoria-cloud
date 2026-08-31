const { app } = require('@azure/functions');
const { obterColecao, json, paraSaida, paraObjectId } = require('../db');

// AZURE FUNCTION 4/4 - EXCLUIR
// DELETE /api/mentores-db/{id}
app.http('mentoresExcluir', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'mentores-db/{id}',
  handler: async (request, context) => {
    const _id = paraObjectId(request.params.id);
    if (!_id) return json(400, { erro: 'Id invalido', id: request.params.id });

    try {
      const colecao = await obterColecao();
      const doc = await colecao.findOneAndDelete({ _id });
      // Excluir id inexistente e 404, nao 200 silencioso.
      if (!doc) return json(404, { erro: 'Mentor nao encontrado', id: request.params.id });
      context.log(`EXCLUIR mentor _id=${_id}`);
      return json(200, { mensagem: 'Mentor excluido', mentor: paraSaida(doc) });
    } catch (erro) {
      context.error(`Falha ao excluir: ${erro.message}`);
      return json(500, { erro: 'Falha ao excluir no MongoDB', detalhe: erro.message });
    }
  },
});
