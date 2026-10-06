const { validarMentor, novoMentor } = require('../../domain/mentor');

/** @param {{repository: import('../../ports/MentorRepository').MentorRepository, corpo: Object, agora?: Date}} entrada */
async function criarMentor({ repository, corpo, agora }) {
  const erros = validarMentor(corpo);
  if (erros.length > 0) return { status: 400, body: { erro: 'Dados invalidos', detalhes: erros } };

  const mentor = await repository.inserir(novoMentor(corpo, agora));
  return { status: 201, body: { mensagem: 'Mentor inserido', mentor } };
}

module.exports = { criarMentor };
