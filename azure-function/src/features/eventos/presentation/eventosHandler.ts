import type { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { eventStore, eventoValido } from "../application/eventStore";
import { json, lerCorpo } from "../../../shared/presentation/respostas";

/** Slice `eventos`: sink HTTP de eventos de domínio (at-least-once + idempotência). */
export async function eventosHandler(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  if (req.method === "GET") {
    const limiteBruto = Number(req.query.get("limite") ?? 50);
    const limite = Number.isFinite(limiteBruto)
      ? Math.min(Math.max(Math.trunc(limiteBruto), 1), 100)
      : 50;
    return json(200, eventStore.listar(limite));
  }

  const corpo = await lerCorpo(req);
  if (!eventoValido(corpo)) {
    return json(400, {
      erro: "Evento inválido. Esperado {id, type, source, time, data}.",
    });
  }

  const novo = eventStore.registrar(corpo);
  context.log(`evento ${corpo.type} (${corpo.id}) ${novo ? "aceito" : "ignorado por idempotência"}`);
  return json(202, { recebido: true, duplicado: !novo });
}
