import type { ListaEventos, Reputacao } from '../../domain/agregado';

/**
 * Porta de saída para a Azure Function (:7071).
 * A Function calcula reputação a partir de uma lista de notas (`POST /api/reputacao`)
 * e serve o sink de eventos de domínio (`GET /api/eventos`).
 */
export interface ReputacaoPort {
  calcular(notas: number[], usuarioId?: string): Promise<Reputacao>;
  listarEventos(limite?: number, usuarioId?: string): Promise<ListaEventos>;
}
