import type { ListaMentores } from '../../domain/types';

export interface FiltrosMentor {
  curso?: string;
  materia?: string;
  q?: string;
}

/** Porta de saída para o Serviço de Mentores (:4001). */
export interface MentoresPort {
  listar(filtros?: FiltrosMentor, usuarioId?: string): Promise<ListaMentores>;
}
