/** Utilitarios puros de texto e identificadores (sem dependencias externas). */

let contador = 0;

/** Gera ids locais unicos o suficiente para a demo (sem importar crypto). */
export function gerarId(prefixo: string): string {
  contador = (contador + 1) % 1_000_000;
  const aleatorio = Math.random().toString(36).slice(2, 8);
  return `${prefixo}${Date.now().toString(36)}${contador.toString(36)}${aleatorio}`;
}

/** Remove acentos e normaliza caixa para comparacoes de busca. */
export function normalizarTexto(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function contemTexto(alvo: string | null | undefined, termo: string): boolean {
  return normalizarTexto(alvo).includes(normalizarTexto(termo));
}
