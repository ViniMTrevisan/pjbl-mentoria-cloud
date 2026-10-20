import { ErroDependencia } from '../../application/errors';
import type { FiltrosSessao, SessoesPort } from '../../application/ports/SessoesPort';
import type { ListaSessoes } from '../../domain/types';
import type { HttpClient } from './httpClient';

export class SessoesHttpClient implements SessoesPort {
  constructor(private readonly http: HttpClient) {}

  async listar(filtros: FiltrosSessao = {}, usuarioId?: string): Promise<ListaSessoes> {
    const resposta = await this.http.requisitar('/sessoes', {
      query: { usuarioId: filtros.usuarioId, status: filtros.status },
      usuarioId,
    });

    if (resposta.status !== 200 || !resposta.corpo) {
      throw new ErroDependencia('sessoes', 'formato', 'Serviço de sessões respondeu fora do contrato');
    }

    return resposta.corpo as ListaSessoes;
  }
}
