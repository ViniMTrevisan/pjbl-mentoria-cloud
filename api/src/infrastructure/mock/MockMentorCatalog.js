const { mentores, sessoes } = require('../../data/mock');

function criarCatalogoMock() {
  return {
    async listarMentores() {
      return mentores;
    },
    async buscarMentorPorId(id) {
      return mentores.find((mentor) => mentor.id === id) || null;
    },
    async listarSessoes() {
      return sessoes;
    },
  };
}

module.exports = { criarCatalogoMock };
