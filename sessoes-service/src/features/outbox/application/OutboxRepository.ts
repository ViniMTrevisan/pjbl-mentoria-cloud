import type { EventoPendente } from '../../sessoes/domain/sessao';

/** Contrato do outbox transacional: fila de eventos de domínio pendentes. */
export interface OutboxRepository {
  listarPendentes(limite: number): Promise<EventoPendente[]>;
  marcarPublicado(id: string, quando: string): Promise<void>;
}
