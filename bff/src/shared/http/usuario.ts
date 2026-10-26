import type { Request } from 'express';

export const USUARIO_PADRAO = 'u1';
const FORMATO_USUARIO = /^[A-Za-z0-9_-]{1,40}$/;

/**
 * Identidade simulada da Entrega 3, em ordem de precedência:
 * header X-Usuario-Id → query `usuarioId` → `u1`.
 * Valores fora do formato esperado caem no padrão em vez de propagar lixo.
 */
export function resolverUsuarioId(req: Request): string {
  const doHeader = req.header('x-usuario-id');
  if (doHeader && FORMATO_USUARIO.test(doHeader)) return doHeader;

  const daQuery = req.query.usuarioId;
  if (typeof daQuery === 'string' && FORMATO_USUARIO.test(daQuery)) return daQuery;

  return USUARIO_PADRAO;
}

/** Mantém apenas strings simples da query, descartando arrays/objetos aninhados. */
export function querySimples(req: Request): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(req.query)) {
    if (typeof valor === 'string' && valor.length > 0) saida[chave] = valor;
  }
  return saida;
}
