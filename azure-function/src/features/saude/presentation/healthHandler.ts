import type { HttpResponseInit } from "@azure/functions";
import { json } from "../../../shared/presentation/respostas";

/** Slice `saude`: prova de vida da Function. */
export async function healthHandler(): Promise<HttpResponseInit> {
  return json(200, {
    status: "ok",
    servico: "function-reputacao",
    runtime: "azure-functions-node-v4",
    hora: new Date().toISOString(),
  });
}
