import { ErroDependencia } from '../../application/errors';
import type { ReputacaoPort } from '../../application/ports/ReputacaoPort';
import type { ListaEventos, Reputacao } from '../../domain/types';
import type { HttpClient } from './httpClient';

export class ReputacaoHttpClient implements ReputacaoPort {
  constructor(private readonly http: HttpClient) {}

  async calcular(notas: number[], usuarioId?: string): Promise<Reputacao> {
    const resposta = await this.http.requisitar('/api/reputacao', {
      metodo: 'POST',
      corpo: { notas },
      usuarioId,
    });

    if (resposta.status !== 200 || !resposta.corpo) {
      throw new ErroDependencia('reputacao', 'formato', 'Function respondeu fora do contrato');
    }

    return resposta.corpo as Reputacao;
  }

  async listarEventos(limite = 20, usuarioId?: string): Promise<ListaEventos> {
    const resposta = await this.http.requisitar('/api/eventos', {
      query: { limite },
      usuarioId,
    });

    if (resposta.status !== 200 || !resposta.corpo) {
      throw new ErroDependencia('reputacao', 'formato', 'Eventos indisponíveis');
    }

    return resposta.corpo as ListaEventos;
  }
}
