import type { HttpClient, ParametrosQuery, RespostaBruta } from './httpClient';

export interface EntradaProxy {
  caminho: string;
  query?: ParametrosQuery;
  corpo?: unknown;
  usuarioId?: string;
}

/**
 * Encaminha uma requisição quase crua para um serviço interno.
 * Não interpreta status: o HTTP layer decide o que repassar.
 */
export class ServicoProxy {
  constructor(
    private readonly http: HttpClient,
    readonly servico: string,
  ) {}

  encaminhar(
    metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    entrada: EntradaProxy,
  ): Promise<RespostaBruta> {
    return this.http.requisitar(entrada.caminho, {
      metodo,
      query: entrada.query,
      corpo: entrada.corpo,
      usuarioId: entrada.usuarioId,
    });
  }

  /** Ping curto usado pelo /health; qualquer falha vira `false`. */
  async disponivel(caminho: string, timeoutMs: number): Promise<boolean> {
    try {
      const resposta = await this.http.requisitar(caminho, { timeoutMs });
      return resposta.status >= 200 && resposta.status < 300;
    } catch {
      return false;
    }
  }
}
