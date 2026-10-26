import { app } from "@azure/functions";
import { reputacaoHandler } from "../features/reputacao/presentation/reputacaoHandler";
import { eventosHandler } from "../features/eventos/presentation/eventosHandler";
import { healthHandler } from "../features/saude/presentation/healthHandler";

/** Composition root: registra as rotas HTTP apontando para os slices. */
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
