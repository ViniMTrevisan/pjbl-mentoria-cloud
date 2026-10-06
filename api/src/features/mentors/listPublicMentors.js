const { calcularReputacao } = require('../../domain/mentor');

const contem = (texto, termo) => (texto || '').toLowerCase().includes(termo.toLowerCase());

async function listarMentoresPublicos({ catalogo, filtros }) {
  const curso = filtros.curso || '';
  const materia = filtros.materia || '';
  const q = filtros.q || '';

  const resultado = (await catalogo.listarMentores())
    .filter((mentor) => mentor.ehMentor && mentor.areas.length > 0)
    .filter((mentor) => !curso || mentor.areas.some((area) => contem(area.curso, curso)) || contem(mentor.curso, curso))
    .filter((mentor) => !materia || mentor.areas.some((area) => contem(area.materia, materia)))
    .filter((mentor) => !q || contem(mentor.nome, q) || contem(mentor.bio, q) || mentor.areas.some((area) => contem(area.materia, q)))
    .map((mentor) => ({
      id: mentor.id,
      nome: mentor.nome,
      curso: mentor.curso,
      periodo: mentor.periodo,
      bio: mentor.bio,
      areas: mentor.areas,
      reputacao: calcularReputacao(mentor.avaliacoes),
    }))
    .sort((a, b) => (b.reputacao.media ?? -1) - (a.reputacao.media ?? -1));

  return { status: 200, body: { total: resultado.length, filtros: { curso, materia, q }, mentores: resultado } };
}

module.exports = { listarMentoresPublicos };
