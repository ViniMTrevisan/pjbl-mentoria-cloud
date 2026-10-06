const { MongoClient } = require('mongodb');

function criarProvedorColecao(ambiente = process.env) {
  let promessaCliente = null;

  return async function obterColecaoMentores() {
    const uri = ambiente.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI nao configurada na Function App');

    if (!promessaCliente) {
      promessaCliente = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 })
        .connect()
        .catch((erro) => {
          promessaCliente = null;
          throw erro;
        });
    }

    const cliente = await promessaCliente;
    const nomeBanco = ambiente.MONGODB_DB || 'pjbl_mentoria';
    return cliente.db(nomeBanco).collection('mentores');
  };
}

module.exports = { criarProvedorColecao };
