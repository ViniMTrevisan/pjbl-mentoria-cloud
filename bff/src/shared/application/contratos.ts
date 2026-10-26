/**
 * Contratos de I/O compartilhados pelos adaptadores HTTP.
 * Vivem na camada de aplicação para que apresentação e infraestrutura
 * dependam da mesma abstração, e não uma da outra.
 */

export type ParametrosQuery = Record<string, string | number | boolean | undefined | null>;

export type MetodoHttp = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OpcoesRequisicao {
  metodo?: MetodoHttp;
  query?: ParametrosQuery;
  corpo?: unknown;
  /** Repassado como `X-Usuario-Id`; nunca é inventado aqui. */
  usuarioId?: string;
  /** Sobrescreve o orçamento padrão (usado pelo /health). */
  timeoutMs?: number;
}

export interface RespostaBruta {
  status: number;
  tipoConteudo: string | null;
  /** Corpo já parseado quando é JSON; `null` quando vazio ou não-JSON. */
  corpo: unknown;
  /** Corpo cru, preservado para o proxy repassar sem reinterpretar. */
  texto: string;
}
