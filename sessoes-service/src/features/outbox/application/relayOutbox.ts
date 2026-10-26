import type { OutboxRepository } from './OutboxRepository';

export interface RelayDeps {
  outbox: OutboxRepository;
  sinkUrl: string;
  fetchImpl?: typeof fetch;
  log?: (mensagem: string) => void;
}

export interface RelayResultado {
  publicados: number;
  falhas: number;
}

/**
 * Publica os eventos pendentes no sink. Falha de rede/timeout mantem a linha
 * pendente para a proxima rodada (at-least-once) e nunca derruba o processo.
 */
export async function relayOutbox(deps: RelayDeps): Promise<RelayResultado> {
  const url = `${deps.sinkUrl.replace(/\/+$/, '')}/api/eventos`;
  const enviar = deps.fetchImpl ?? fetch;
  const pendentes = await deps.outbox.listarPendentes(20);

  let publicados = 0;
  let falhas = 0;
  let ultimoErro = '';

  for (const evento of pendentes) {
    try {
      const resposta = await enviar(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: evento.payload,
        signal: AbortSignal.timeout(3000),
      });
      if (!resposta.ok) {
        falhas += 1;
        ultimoErro = `sink respondeu ${resposta.status}`;
        continue;
      }
      await deps.outbox.marcarPublicado(evento.id, new Date().toISOString());
      publicados += 1;
    } catch (erro) {
      falhas += 1;
      ultimoErro = (erro as Error).message;
    }
  }

  if (falhas > 0) {
    deps.log?.(`${falhas} evento(s) mantido(s) pendente(s): ${ultimoErro}`);
  }

  return { publicados, falhas };
}
