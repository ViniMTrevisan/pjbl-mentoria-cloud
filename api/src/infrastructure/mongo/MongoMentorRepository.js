const { ObjectId } = require('mongodb');

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paraSaida(documento) {
  if (!documento) return null;
  const { _id, ...campos } = documento;
  return { ...campos, id: String(_id) };
}

function criarMongoMentorRepository({ obterColecao }) {
  return {
    idValido(id) {
      return ObjectId.isValid(id);
    },

    async pesquisar(consulta = '') {
      const colecao = await obterColecao();
      const filtro = consulta
        ? (() => {
            const regex = { $regex: escaparRegex(consulta), $options: 'i' };
            return { $or: [{ nome: regex }, { curso: regex }, { bio: regex }, { 'areas.materia': regex }] };
          })()
        : {};

      const documentos = await colecao.find(filtro).sort({ nome: 1 }).limit(100).toArray();
      return documentos.map(paraSaida);
    },

    async buscarPorId(id) {
      const colecao = await obterColecao();
      const documento = await colecao.findOne({ _id: new ObjectId(id) });
      return paraSaida(documento);
    },

    async inserir(mentor) {
      const colecao = await obterColecao();
      const resultado = await colecao.insertOne(mentor);
      return paraSaida({ ...mentor, _id: resultado.insertedId });
    },

    async alterar(id, campos) {
      const colecao = await obterColecao();
      const documento = await colecao.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: campos },
        { returnDocument: 'after' },
      );
      return paraSaida(documento);
    },

    async excluir(id) {
      const colecao = await obterColecao();
      const documento = await colecao.findOneAndDelete({ _id: new ObjectId(id) });
      return paraSaida(documento);
    },
  };
}

module.exports = { criarMongoMentorRepository };
