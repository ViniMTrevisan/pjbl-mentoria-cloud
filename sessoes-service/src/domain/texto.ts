/** Utilitarios puros de texto e identificadores (sem dependencias externas). */

let contador = 0;

export function gerarId(prefixo: string): string {
  contador = (contador + 1) % 1_000_000;
  const aleatorio = Math.random().toString(36).slice(2, 8);
  return `${prefixo}${Date.now().toString(36)}${contador.toString(36)}${aleatorio}`;
}

export function texto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor.trim() : null;
}

export function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}
