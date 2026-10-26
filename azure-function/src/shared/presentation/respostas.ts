import type { HttpRequest, HttpResponseInit } from "@azure/functions";

/** Resposta JSON padrão dos handlers desta Function. */
export function json(status: number, body: unknown): HttpResponseInit {
  return {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

/** Lê o corpo JSON sem lançar: corpo inválido vira `undefined`. */
export async function lerCorpo(req: HttpRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}
