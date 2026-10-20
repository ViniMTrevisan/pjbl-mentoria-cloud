import type { Agregado, EntradaSessao, Sessao } from './types';

export const GATEWAY_URL =
  (import.meta.env.VITE_GATEWAY_URL as string | undefined) || 'http://localhost:8080/api';

const TIMEOUT_MS = 5000;

export class ErroApi extends Error {
  readonly status: number | null;

  constructor(mensagem: string, status: number | null = null) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
  }
}

function mensagemAmigavel(status: number, corpo: unknown): string {
  const doServidor =
    corpo && typeof corpo === 'object' && 'erro' in corpo
      ? String((corpo as { erro: unknown }).erro)
      : '';

  if (status === 403) return doServidor || 'Você não pode solicitar esta sessão.';
  if (status === 404) return doServidor || 'Esse mentor não está mais disponível.';
  if (status === 409) return doServidor || 'Esse horário acabou de ser ocupado.';
  if (status === 422) return doServidor || 'Confira a data e o assunto antes de enviar.';
  if (status >= 500) return 'O servidor teve um problema. Tente novamente em instantes.';
  return doServidor || `A requisição falhou (${status}).`;
}

async function requisitar<T>(
  caminho: string,
  usuarioId: string,
  init: { metodo?: string; corpo?: unknown } = {},
): Promise<T> {
  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(`${GATEWAY_URL}${caminho}`, {
      method: init.metodo ?? 'GET',
      headers: {
        Accept: 'application/json',
        'X-Usuario-Id': usuarioId,
        ...(init.corpo === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: init.corpo === undefined ? undefined : JSON.stringify(init.corpo),
      signal: controlador.signal,
    });

    const corpo: unknown = await resposta.json().catch(() => null);
    if (!resposta.ok) {
      throw new ErroApi(mensagemAmigavel(resposta.status, corpo), resposta.status);
    }
    return corpo as T;
  } catch (erro) {
    if (erro instanceof ErroApi) throw erro;
    if (erro instanceof DOMException && erro.name === 'AbortError') {
      throw new ErroApi('O servidor demorou para responder. Tente novamente.');
    }
    throw new ErroApi('Não foi possível falar com o servidor. Verifique sua conexão.');
  } finally {
    clearTimeout(timer);
  }
}

export function buscarAgregado(usuarioId: string): Promise<Agregado> {
  return requisitar<Agregado>(
    `/aggregated-data?usuarioId=${encodeURIComponent(usuarioId)}`,
    usuarioId,
  );
}

export function criarSessao(usuarioId: string, dados: EntradaSessao): Promise<Sessao> {
  return requisitar<Sessao>('/sessoes', usuarioId, { metodo: 'POST', corpo: dados });
}
