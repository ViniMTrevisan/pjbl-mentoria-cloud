const { criarProvedorColecao } = require('../infrastructure/mongo/client');
const { criarMongoMentorRepository } = require('../infrastructure/mongo/MongoMentorRepository');
const { criarCatalogoMock } = require('../infrastructure/mock/MockMentorCatalog');

const obterColecao = criarProvedorColecao();
const mentorRepository = criarMongoMentorRepository({ obterColecao });
const catalogoMock = criarCatalogoMock();

module.exports = { mentorRepository, catalogoMock };
