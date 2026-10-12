/**
 * Contrato estrutural de leitura usado pelas fatias públicas (mentores e sessões).
 *
 * @typedef {Object} CatalogoMentores
 * @property {() => Promise<Object[]>} listarMentores
 * @property {(id: string) => Promise<Object|null>} buscarMentorPorId
 * @property {() => Promise<Object[]>} listarSessoes
 */
module.exports = {};
