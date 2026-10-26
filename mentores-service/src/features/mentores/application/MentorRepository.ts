import type { Mentor } from '../domain/mentor';

/** Contrato de persistencia de mentores. */
export interface MentorRepository {
  listar(): Promise<Mentor[]>;
  buscarPorId(id: string): Promise<Mentor | null>;
  criar(mentor: Mentor): Promise<Mentor>;
  atualizar(mentor: Mentor): Promise<Mentor | null>;
  remover(id: string): Promise<boolean>;
  /** Insere varios documentos (usado pelo seed). */
  inserirVarios(mentores: Mentor[]): Promise<void>;
  contar(): Promise<number>;
  verificarSaude(): Promise<boolean>;
}
