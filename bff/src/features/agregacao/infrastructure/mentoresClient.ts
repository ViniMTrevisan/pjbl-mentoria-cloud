import { ErroDependencia } from '../../../shared/errors';
import type { FiltrosMentor, MentoresPort } from '../application/ports/MentoresPort';
import type { ListaMentores } from '../domain/agregado';
import type { HttpClient } from '../../../shared/infrastructure/httpClient';

export class MentoresHttpClient implements MentoresPort {
  constructor(private readonly http: HttpClient) {}

  async listar(filtros: FiltrosMentor = {}, usuarioId?: string): Promise<ListaMentores> {
    const resposta = await this.http.requisitar('/mentores', {
      query: { curso: filtros.curso, materia: filtros.materia, q: filtros.q },
      usuarioId,
    });

    if (resposta.status !== 200 || !resposta.corpo) {
      throw new ErroDependencia('mentores', 'formato', 'Serviço de mentores respondeu fora do contrato');
    }

    return resposta.corpo as ListaMentores;
  }
}
