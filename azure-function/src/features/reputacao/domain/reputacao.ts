export type Selo = "novo" | "confiavel" | "excelente";

export interface Distribuicao {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface Reputacao {
  total: number;
  media: number | null;
  distribuicao: Distribuicao;
  selo: Selo;
  semAvaliacoes: boolean;
}

export class ReputacaoInvalidaError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ReputacaoInvalidaError";
  }
}

function arredondarUmaCasa(valor: number): number {
  return Math.round(valor * 10) / 10;
}

export function seloPara(media: number | null, total: number): Selo {
  if (media === null || total === 0) return "novo";
  if (media >= 4.5 && total >= 3) return "excelente";
  if (media >= 3.5) return "confiavel";
  return "novo";
}

/**
 * Regra pura de reputação: média aritmética das notas válidas (1..5),
 * arredondada em uma casa decimal. Nota fora da faixa é erro de contrato,
 * nunca é silenciosamente ignorada.
 */
export function calcularReputacao(notas: unknown, avaliacoes?: unknown): Reputacao {
  const lista = normalizarEntrada(notas, avaliacoes);
  const distribuicao: Distribuicao = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const nota of lista) {
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      throw new ReputacaoInvalidaError("Nota deve ser um inteiro entre 1 e 5.");
    }
    distribuicao[nota as 1 | 2 | 3 | 4 | 5] += 1;
  }

  const total = lista.length;
  if (total === 0) {
    return { total: 0, media: null, distribuicao, selo: "novo", semAvaliacoes: true };
  }

  const soma = lista.reduce((acc, nota) => acc + nota, 0);
  const media = arredondarUmaCasa(soma / total);
  return { total, media, distribuicao, selo: seloPara(media, total), semAvaliacoes: false };
}

function normalizarEntrada(notas: unknown, avaliacoes: unknown): number[] {
  if (notas !== undefined) {
    if (!Array.isArray(notas)) {
      throw new ReputacaoInvalidaError("O campo notas deve ser um array.");
    }
    return notas.map(paraNota);
  }

  if (avaliacoes !== undefined) {
    if (!Array.isArray(avaliacoes)) {
      throw new ReputacaoInvalidaError("O campo avaliacoes deve ser um array.");
    }
    return avaliacoes.map((item) => {
      if (typeof item !== "object" || item === null) {
        throw new ReputacaoInvalidaError("Cada avaliação deve ser um objeto com nota.");
      }
      return paraNota((item as { nota?: unknown }).nota);
    });
  }

  throw new ReputacaoInvalidaError("Informe notas ou avaliacoes.");
}

function paraNota(valor: unknown): number {
  if (typeof valor !== "number") {
    throw new ReputacaoInvalidaError("Cada nota deve ser numérica.");
  }
  return valor;
}
