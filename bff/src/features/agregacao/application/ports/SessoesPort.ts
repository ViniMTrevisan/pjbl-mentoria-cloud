import type { ListaSessoes, StatusSessao } from '../../domain/agregado';

export interface FiltrosSessao {
  usuarioId?: string;
  status?: StatusSessao;
}

/** Porta de saída para o Serviço de Sessões (:4002). */
export interface SessoesPort {
  listar(filtros?: FiltrosSessao, usuarioId?: string): Promise<ListaSessoes>;
}
