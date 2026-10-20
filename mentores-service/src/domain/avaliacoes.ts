import type { Avaliacao, CriarAvaliacaoInput, Mentor } from './mentor';
import { conflito, dadosInvalidos } from './errors';
import { gerarId } from './texto';

const MAX_COMENTARIO = 600;

/** Adiciona uma avaliacao ao mentor. sessaoId duplicado gera conflito (409). */
export function adicionarAvaliacao(
  mentor: Mentor,
  input: CriarAvaliacaoInput,
  agora: string,
): { mentor: Mentor; avaliacao: Avaliacao } {
  const campos: Record<string, string> = {};

  const sessaoId = typeof input.sessaoId === 'string' ? input.sessaoId.trim() : '';
  if (!sessaoId) campos.sessaoId = 'sessaoId obrigatorio';

  if (
    typeof input.nota !== 'number' ||
    !Number.isInteger(input.nota) ||
    input.nota < 1 ||
    input.nota > 5
  ) {
    campos.nota = 'inteiro de 1 a 5';
  }

  const comentario =
    typeof input.comentario === 'string' ? input.comentario.trim() : undefined;
  if (comentario && comentario.length > MAX_COMENTARIO) {
    campos.comentario = `maximo de ${MAX_COMENTARIO} caracteres`;
  }

  if (Object.keys(campos).length > 0) throw dadosInvalidos(campos);

  if (mentor.avaliacoes.some((avaliacao) => avaliacao.sessaoId === sessaoId)) {
    throw conflito('sessao ja avaliada para este mentor');
  }

  const avaliacao: Avaliacao = {
    id: gerarId('av'),
    sessaoId,
    nota: input.nota,
    ...(comentario ? { comentario } : {}),
    criadaEm: agora,
  };

  return {
    mentor: {
      ...mentor,
      avaliacoes: [...mentor.avaliacoes, avaliacao],
      atualizadoEm: agora,
    },
    avaliacao,
  };
}
