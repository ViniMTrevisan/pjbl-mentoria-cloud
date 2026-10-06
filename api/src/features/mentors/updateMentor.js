const { validarMentor, camposAlterados } = require('../../domain/mentor');

/** @param {{repository: import('../../ports/MentorRepository').MentorRepository, id: string, corpo: Object, agora?: Date}} entrada */
async function alterarMentor({ repository, id, corpo, agora }) {
  if (!repository.idValido(id)) return { status: 400, body: { erro: 'Id invalido', id } };

  const erros = validarMentor(corpo, { parcial: true });
  if (erros.length > 0) return { status: 400, body: { erro: 'Dados invalidos', detalhes: erros } };

  const alteracoes = camposAlterados(corpo, agora);
  if (Object.keys(alteracoes).length === 0) return { status: 400, body: { erro: 'Nenhum campo para alterar' } };

  const mentor = await repository.alterar(id, alteracoes);
  if (!mentor) return { status: 404, body: { erro: 'Mentor nao encontrado', id } };
  return { status: 200, body: { mensagem: 'Mentor alterado', mentor } };
}

module.exports = { alterarMentor };
