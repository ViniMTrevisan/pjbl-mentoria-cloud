/** @param {{repository: import('../../ports/MentorRepository').MentorRepository, id: string}} entrada */
async function excluirMentor({ repository, id }) {
  if (!repository.idValido(id)) return { status: 400, body: { erro: 'Id invalido', id } };

  const mentor = await repository.excluir(id);
  if (!mentor) return { status: 404, body: { erro: 'Mentor nao encontrado', id } };
  return { status: 200, body: { mensagem: 'Mentor excluido', mentor } };
}

module.exports = { excluirMentor };
