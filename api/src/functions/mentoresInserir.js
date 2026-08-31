const { app } = require('@azure/functions');
const { obterColecao, json, paraSaida, validarMentor, lerCorpo } = require('../db');

// AZURE FUNCTION 1/4 - INSERIR
// POST /api/mentores-db
app.http('mentoresInserir', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'mentores-db',
  handler: async (request, context) => {
    const corpo = await lerCorpo(request);
    const erros = validarMentor(corpo);
    if (erros.length > 0) {
      return json(400, { erro: 'Dados invalidos', detalhes: erros });
    }

    const documento = {
      nome: corpo.nome.trim(),
      curso: corpo.curso.trim(),
      periodo: corpo.periodo ?? null,
      bio: (corpo.bio || '').trim(),
      areas: corpo.areas || [],
      criadoEm: new Date().toISOString(),
    };

    try {
      const colecao = await obterColecao();
      const resultado = await colecao.insertOne(documento);
      context.log(`INSERIR mentor _id=${resultado.insertedId}`);
      return json(201, { mensagem: 'Mentor inserido', mentor: paraSaida({ ...documento, _id: resultado.insertedId }) });
    } catch (erro) {
      context.error(`Falha ao inserir: ${erro.message}`);
      return json(500, { erro: 'Falha ao gravar no MongoDB', detalhe: erro.message });
    }
  },
});
