function calcularReputacao(avaliacoes = []) {
  if (avaliacoes.length === 0) return { media: null, total: 0 };
  const soma = avaliacoes.reduce((total, avaliacao) => total + avaliacao.nota, 0);
  return { media: Math.round((soma / avaliacoes.length) * 10) / 10, total: avaliacoes.length };
}

function validarMentor(corpo, { parcial = false } = {}) {
  const erros = [];
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
    return ['corpo da requisicao precisa ser um JSON'];
  }

  const exigido = (campo) => !parcial || corpo[campo] !== undefined;
  if (exigido('nome') && (typeof corpo.nome !== 'string' || corpo.nome.trim() === '')) {
    erros.push('nome e obrigatorio');
  }
  if (exigido('curso') && (typeof corpo.curso !== 'string' || corpo.curso.trim() === '')) {
    erros.push('curso e obrigatorio');
  }
  if (corpo.periodo !== undefined && (!Number.isInteger(corpo.periodo) || corpo.periodo < 1 || corpo.periodo > 12)) {
    erros.push('periodo deve ser inteiro entre 1 e 12');
  }
  if (corpo.areas !== undefined && !Array.isArray(corpo.areas)) {
    erros.push('areas deve ser uma lista');
  }
  return erros;
}

function novoMentor(corpo, agora = new Date()) {
  return {
    nome: corpo.nome.trim(),
    curso: corpo.curso.trim(),
    periodo: corpo.periodo ?? null,
    bio: (corpo.bio || '').trim(),
    areas: corpo.areas || [],
    criadoEm: agora.toISOString(),
  };
}

function camposAlterados(corpo, agora = new Date()) {
  const campos = ['nome', 'curso', 'periodo', 'bio', 'areas'];
  const alteracoes = Object.fromEntries(
    campos.filter((campo) => corpo[campo] !== undefined).map((campo) => [campo, corpo[campo]]),
  );
  if (Object.keys(alteracoes).length > 0) alteracoes.atualizadoEm = agora.toISOString();
  return alteracoes;
}

module.exports = { calcularReputacao, validarMentor, novoMentor, camposAlterados };
