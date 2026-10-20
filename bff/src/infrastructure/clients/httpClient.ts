import { ErroDependencia } from '../../application/errors';

export type ParametrosQuery = Record<string, string | number | boolean | undefined | null>;

export interface OpcoesRequisicao {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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

function montarUrl(base: string, caminho: string, query?: ParametrosQuery): string {
  const raiz = base.replace(/\/+$/, '');
  const trilha = caminho.startsWith('/') ? caminho : `/${caminho}`;
  const url = new URL(`${raiz}${trilha}`);
  if (query) {
    for (const [chave, valor] of Object.entries(query)) {
      if (valor === undefined || valor === null || valor === '') continue;
      url.searchParams.set(chave, String(valor));
    }
  }
  return url.toString();
}

/**
 * Client HTTP único dos adaptadores. Timeout por requisição via AbortSignal,
 * erro de rede/timeout sempre traduzido para ErroDependencia com o nome do serviço.
 */
export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
    private readonly servico: string,
  ) {}

  get servicoNome(): string {
    return this.servico;
  }

  async requisitar(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<RespostaBruta> {
    const metodo = opcoes.metodo ?? 'GET';
    const url = montarUrl(this.baseUrl, caminho, opcoes.query);
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (opcoes.usuarioId) headers['X-Usuario-Id'] = opcoes.usuarioId;
    if (opcoes.corpo !== undefined) headers['Content-Type'] = 'application/json';

    let resposta: Response;
    try {
      resposta = await fetch(url, {
        method: metodo,
        headers,
        body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
        signal: AbortSignal.timeout(opcoes.timeoutMs ?? this.timeoutMs),
      });
    } catch (erro) {
      const nome = erro instanceof Error ? erro.name : '';
      if (nome === 'TimeoutError' || nome === 'AbortError') {
        throw new ErroDependencia(this.servico, 'timeout', `Tempo esgotado em ${this.servico}`);
      }
      throw new ErroDependencia(this.servico, 'rede', `${this.servico} indisponível`);
    }

    const texto = await resposta.text().catch(() => '');
    const tipoConteudo = resposta.headers.get('content-type');
    let corpo: unknown = null;
    if (texto.length > 0) {
      const pareceJson =
        (tipoConteudo ?? '').includes('json') || texto.startsWith('{') || texto.startsWith('[');
      if (pareceJson) {
        try {
          corpo = JSON.parse(texto);
        } catch {
          corpo = null;
        }
      }
    }

    return { status: resposta.status, tipoConteudo, corpo, texto };
  }
}
