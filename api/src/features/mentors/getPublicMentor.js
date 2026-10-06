const { calcularReputacao } = require('../../domain/mentor');

async function obterMentorPublico({ catalogo, id }) {
  const mentor = await catalogo.buscarMentorPorId(id);
  if (!mentor) return { status: 404, body: { erro: 'Mentor não encontrado', id } };

  return {
    status: 200,
    body: {
      id: mentor.id,
      nome: mentor.nome,
      email: mentor.email,
      curso: mentor.curso,
      periodo: mentor.periodo,
      bio: mentor.bio,
      areas: mentor.areas,
      disponibilidades: mentor.disponibilidades,
      avaliacoes: mentor.avaliacoes,
      reputacao: calcularReputacao(mentor.avaliacoes),
    },
  };
}

module.exports = { obterMentorPublico };
