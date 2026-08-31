const { app } = require('@azure/functions');
const { obterColecao, json, paraSaida, paraObjectId, validarMentor, lerCorpo } = require('../db');

// AZURE FUNCTION 3/4 - ALTERAR
// PUT /api/mentores-db/{id}  (aceita atualizacao parcial)
app.http('mentoresAlterar', {
  methods: ['PUT', 'PATCH'],
  authLevel: 'anonymous',
  route: 'mentores-db/{id}',
  handler: async (request, context) => {
    const _id = paraObjectId(request.params.id);
    if (!_id) return json(400, { erro: 'Id invalido', id: request.params.id });

    const corpo = await lerCorpo(request);
    const erros = validarMentor(corpo, { parcial: true });
    if (erros.length > 0) return json(400, { erro: 'Dados invalidos', detalhes: erros });

    // Só grava os campos realmente enviados: PUT parcial não pode apagar o resto.
    const campos = ['nome', 'curso', 'periodo', 'bio', 'areas'];
    const alteracoes = Object.fromEntries(
      campos.filter((c) => corpo[c] !== undefined).map((c) => [c, corpo[c]]),
    );
    if (Object.keys(alteracoes).length === 0) {
      return json(400, { erro: 'Nenhum campo para alterar' });
    }
    alteracoes.atualizadoEm = new Date().toISOString();

    try {
      const colecao = await obterColecao();
      const doc = await colecao.findOneAndUpdate(
        { _id },
        { $set: alteracoes },
        { returnDocument: 'after' },
      );
      if (!doc) return json(404, { erro: 'Mentor nao encontrado', id: request.params.id });
      context.log(`ALTERAR mentor _id=${_id} campos=${Object.keys(alteracoes).join(',')}`);
      return json(200, { mensagem: 'Mentor alterado', mentor: paraSaida(doc) });
    } catch (erro) {
      context.error(`Falha ao alterar: ${erro.message}`);
      return json(500, { erro: 'Falha ao atualizar no MongoDB', detalhe: erro.message });
    }
  },
});
