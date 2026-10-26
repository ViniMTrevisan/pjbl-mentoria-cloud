import type { ParametrosQuery, MetodoHttp, RespostaBruta } from '../application/contratos';
import type { EntradaRemota, ServicoRemoto } from '../application/ServicoRemoto';
import type { HttpClient } from './httpClient';

export type { EntradaRemota } from '../application/ServicoRemoto';

/**
 * Encaminha uma requisição quase crua para um serviço interno.
 * Não interpreta status: o HTTP layer decide o que repassar.
 */
export class ServicoProxy implements ServicoRemoto {
  constructor(
    private readonly http: HttpClient,
    readonly servico: string,
  ) {}

  encaminhar(metodo: MetodoHttp, entrada: EntradaRemota): Promise<RespostaBruta> {
    return this.http.requisitar(entrada.caminho, {
      metodo,
      query: entrada.query as ParametrosQuery | undefined,
      corpo: entrada.corpo,
      usuarioId: entrada.usuarioId,
    });
  }

  async disponivel(caminho: string, timeoutMs: number): Promise<boolean> {
    try {
      const resposta = await this.http.requisitar(caminho, { timeoutMs });
      return resposta.status >= 200 && resposta.status < 300;
    } catch {
      return false;
    }
  }
}
