// Conexao unica com o MongoDB Atlas, compartilhada pelas 4 Azure Functions.
// O client fica em escopo de modulo: em Functions serverless o processo e
// reaproveitado entre invocacoes, entao abrir um pool novo por request
// estouraria o limite de conexoes do cluster.
const { MongoClient, ObjectId } = require('mongodb');

const URI = process.env.MONGODB_URI;
const NOME_BANCO = process.env.MONGODB_DB || 'pjbl_mentoria';
const NOME_COLECAO = 'mentores';

let promessaCliente = null;

function obterColecao() {
  if (!URI) {
    throw new Error('MONGODB_URI nao configurada na Function App');
  }
  if (!promessaCliente) {
    promessaCliente = new MongoClient(URI, { serverSelectionTimeoutMS: 8000 })
      .connect()
      .catch((erro) => {
        promessaCliente = null; // permite nova tentativa na proxima invocacao
        throw erro;
      });
  }
  return promessaCliente.then((cliente) => cliente.db(NOME_BANCO).collection(NOME_COLECAO));
}

const json = (status, body) => ({
  status,
  jsonBody: body,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

// _id do Mongo nao e serializavel direto para o front; vira string "id".
const paraSaida = (doc) => (doc ? { ...doc, id: String(doc._id), _id: undefined } : doc);

// Converte o id da rota em ObjectId. Id malformado e erro do cliente (400),
// nao falha do servidor (500).
function paraObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

// Escapa metacaracteres antes de montar o $regex da pesquisa, senao um "("
// digitado na busca derruba a query.
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


// Validacao minima compartilhada por inserir e alterar. Devolve lista de erros
// (vazia = ok). "parcial" permite PUT enviando so os campos que mudaram.
function validarMentor(corpo, { parcial = false } = {}) {
  const erros = [];
  if (!corpo || typeof corpo !== 'object') return ['corpo da requisicao precisa ser um JSON'];

  const exigido = (campo) => parcial ? corpo[campo] !== undefined : true;

  if (exigido('nome') && (typeof corpo.nome !== 'string' || corpo.nome.trim() === '')) {
    erros.push('nome e obrigatorio');
  }
  if (exigido('curso') && (typeof corpo.curso !== 'string' || corpo.curso.trim() === '')) {
    erros.push('curso e obrigatorio');
  }
  if (corpo.periodo !== undefined && (!Number.isInteger(corpo.periodo) || corpo.periodo < 1 || corpo.periodo > 12)) {
    erros.push('periodo deve ser inteiro entre 1 e 12');
  }
  if (corpo.areas !== undefined && !Array.isArray(corpo.areas)) {
    erros.push('areas deve ser uma lista');
  }
  return erros;
}

// Le o JSON do body sem estourar 500 quando o cliente manda corpo vazio/invalido.
async function lerCorpo(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

module.exports = { obterColecao, json, paraSaida, paraObjectId, escaparRegex, validarMentor, lerCorpo, NOME_BANCO, NOME_COLECAO };
