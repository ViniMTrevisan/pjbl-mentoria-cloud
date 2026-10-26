import { describe, expect, it } from "vitest";
import { calcularReputacao, ReputacaoInvalidaError, seloPara } from "../src/features/reputacao/domain/reputacao";

describe("calcularReputacao", () => {
  it("sem notas devolve media null e semAvaliacoes", () => {
    expect(calcularReputacao([])).toEqual({
      total: 0,
      media: null,
      distribuicao: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      selo: "novo",
      semAvaliacoes: true,
    });
  });

  it("calcula média arredondada em uma casa", () => {
    const resultado = calcularReputacao([5, 4, 4]);
    expect(resultado.media).toBe(4.3);
    expect(resultado.total).toBe(3);
  });

  it("monta a distribuição por nota", () => {
    const resultado = calcularReputacao([1, 5, 5, 3, 5]);
    expect(resultado.distribuicao).toEqual({ 1: 1, 2: 0, 3: 1, 4: 0, 5: 3 });
  });

  it("aceita o formato de avaliações", () => {
    const resultado = calcularReputacao(undefined, [{ nota: 5 }, { nota: 3 }]);
    expect(resultado.media).toBe(4);
  });

  it("rejeita nota fora da faixa", () => {
    expect(() => calcularReputacao([6])).toThrow(ReputacaoInvalidaError);
    expect(() => calcularReputacao([0])).toThrow(ReputacaoInvalidaError);
  });

  it("rejeita nota fracionária", () => {
    expect(() => calcularReputacao([4.5])).toThrow(ReputacaoInvalidaError);
  });

  it("rejeita entrada ausente", () => {
    expect(() => calcularReputacao(undefined)).toThrow(ReputacaoInvalidaError);
  });
});

describe("seloPara", () => {
  it("excelente exige média alta e pelo menos 3 notas", () => {
    expect(seloPara(4.8, 3)).toBe("excelente");
    expect(seloPara(4.8, 2)).toBe("confiavel");
  });

  it("novo para média baixa ou ausente", () => {
    expect(seloPara(null, 0)).toBe("novo");
    expect(seloPara(3.2, 4)).toBe("novo");
  });
});
