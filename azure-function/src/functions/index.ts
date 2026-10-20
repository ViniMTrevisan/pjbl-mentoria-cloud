import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { calcularReputacao, ReputacaoInvalidaError } from "../domain/reputacao";
import { eventStore, eventoValido } from "../infrastructure/eventStore";

function json(status: number, body: unknown): HttpResponseInit {
  return {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

async function lerCorpo(req: HttpRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

export async function reputacaoHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const corpo = (await lerCorpo(req)) as { notas?: unknown; avaliacoes?: unknown } | undefined;
  if (!corpo || typeof corpo !== "object") {
    return json(400, { erro: "Corpo JSON obrigatório." });
  }

  try {
    const resultado = calcularReputacao(corpo.notas, corpo.avaliacoes);
    context.log(`reputacao calculada: total=${resultado.total} media=${resultado.media}`);
    return json(200, resultado);
  } catch (erro) {
    if (erro instanceof ReputacaoInvalidaError) {
      return json(422, { erro: erro.message });
    }
    context.error("falha inesperada no cálculo de reputação", erro);
    return json(500, { erro: "Falha ao calcular reputação." });
  }
}

export async function eventosHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === "GET") {
    const limiteBruto = Number(req.query.get("limite") ?? 50);
    const limite = Number.isFinite(limiteBruto) ? Math.min(Math.max(Math.trunc(limiteBruto), 1), 100) : 50;
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

export async function healthHandler(): Promise<HttpResponseInit> {
  return json(200, {
    status: "ok",
    servico: "function-reputacao",
    runtime: "azure-functions-node-v4",
    hora: new Date().toISOString(),
  });
}

app.http("reputacao", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "reputacao",
  handler: reputacaoHandler,
});

app.http("eventos", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "eventos",
  handler: eventosHandler,
});

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: healthHandler,
});
