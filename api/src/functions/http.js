function json(status, body) {
  return {
    status,
    jsonBody: body,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  };
}

async function lerCorpo(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function executarCasoHttp(context, operacao, mensagemErro, casoDeUso) {
  try {
    const resultado = await casoDeUso();
    return json(resultado.status, resultado.body);
  } catch (erro) {
    context.error(`${operacao}: ${erro.message}`);
    return json(500, { erro: mensagemErro, detalhe: 'Tente novamente mais tarde.' });
  }
}

module.exports = { json, lerCorpo, executarCasoHttp };
