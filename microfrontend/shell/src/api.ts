import type { Agregado } from './types';

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

  if (status === 403) return doServidor || 'Você não tem permissão para esta ação.';
  if (status === 404) return doServidor || 'Não encontramos o que você procura.';
  if (status === 409) return doServidor || 'Essa ação não é mais possível neste estado.';
  if (status === 422) return doServidor || 'Confira os dados enviados e tente de novo.';
  if (status >= 500) return 'O servidor teve um problema. Tente novamente em instantes.';
  return doServidor || `A requisição falhou (${status}).`;
}

export async function buscarAgregado(usuarioId: string): Promise<Agregado> {
  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(`${GATEWAY_URL}/aggregated-data?usuarioId=${encodeURIComponent(usuarioId)}`, {
      headers: {
        Accept: 'application/json',
        'X-Usuario-Id': usuarioId,
      },
      signal: controlador.signal,
    });

    const corpo: unknown = await resposta.json().catch(() => null);
    if (!resposta.ok) {
      throw new ErroApi(mensagemAmigavel(resposta.status, corpo), resposta.status);
    }
    return corpo as Agregado;
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
