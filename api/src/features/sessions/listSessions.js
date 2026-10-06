async function listarSessoes({ catalogo, status = '', agora = new Date() }) {
  const lista = (await catalogo.listarSessoes())
    .filter((sessao) => !status || sessao.status === status.toUpperCase())
    .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

  return {
    status: 200,
    body: {
      total: lista.length,
      proximas: lista.filter((sessao) => new Date(sessao.dataHora) >= agora && ['SOLICITADA', 'ACEITA'].includes(sessao.status)),
      historico: lista.filter((sessao) => new Date(sessao.dataHora) < agora || ['CONCLUIDA', 'CANCELADA', 'RECUSADA'].includes(sessao.status)),
      sessoes: lista,
    },
  };
}

module.exports = { listarSessoes };
