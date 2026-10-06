/** @param {{repository: import('../../ports/MentorRepository').MentorRepository, consulta: string, id: string}} entrada */
async function pesquisarMentores({ repository, consulta, id }) {
  if (id) {
    if (!repository.idValido(id)) return { status: 400, body: { erro: 'Id invalido', id } };
    const mentor = await repository.buscarPorId(id);
    if (!mentor) return { status: 404, body: { erro: 'Mentor nao encontrado', id } };
    return { status: 200, body: { total: 1, mentores: [mentor] } };
  }

  const mentores = await repository.pesquisar(consulta);
  return { status: 200, body: { total: mentores.length, filtro: { q: consulta, id }, mentores } };
}

module.exports = { pesquisarMentores };
