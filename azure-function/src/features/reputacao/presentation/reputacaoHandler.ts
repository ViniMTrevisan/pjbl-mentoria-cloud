import type { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { calcularReputacao, ReputacaoInvalidaError } from "../domain/reputacao";
import { json, lerCorpo } from "../../../shared/presentation/respostas";

/** Slice `reputacao`: cálculo da nota média a partir das avaliações recebidas. */
export async function reputacaoHandler(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
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
