/**
 * Contrato estrutural usado pelas fatias de mentores (injeção por dependência).
 *
 * @typedef {Object} MentorRepository
 * @property {(query: string) => Promise<Object[]>} pesquisar
 * @property {(id: string) => boolean} idValido
 * @property {(id: string) => Promise<Object|null>} buscarPorId
 * @property {(mentor: Object) => Promise<Object>} inserir
 * @property {(id: string, campos: Object) => Promise<Object|null>} alterar
 * @property {(id: string) => Promise<Object|null>} excluir
 */
module.exports = {};
