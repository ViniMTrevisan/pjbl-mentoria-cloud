import type { Mentor } from '../domain/mentor';
import type { MentorRepository } from '../application/MentorRepository';
import { clonarMentoresSeed } from './mentoresSeed';

function clonar(mentor: Mentor): Mentor {
  return JSON.parse(JSON.stringify(mentor)) as Mentor;
}

/** Adaptador em memoria para dev/testes sem MongoDB. */
export class InMemoryMentorRepository implements MentorRepository {
  private readonly itens = new Map<string, Mentor>();

  constructor(inicial: Mentor[] = clonarMentoresSeed()) {
    for (const mentor of inicial) this.itens.set(mentor.id, clonar(mentor));
  }

  async listar(): Promise<Mentor[]> {
    return Array.from(this.itens.values()).map(clonar);
  }

  async buscarPorId(id: string): Promise<Mentor | null> {
    const mentor = this.itens.get(id);
    return mentor ? clonar(mentor) : null;
  }

  async criar(mentor: Mentor): Promise<Mentor> {
    this.itens.set(mentor.id, clonar(mentor));
    return clonar(mentor);
  }

  async atualizar(mentor: Mentor): Promise<Mentor | null> {
    if (!this.itens.has(mentor.id)) return null;
    this.itens.set(mentor.id, clonar(mentor));
    return clonar(mentor);
  }

  async remover(id: string): Promise<boolean> {
    return this.itens.delete(id);
  }

  async inserirVarios(mentores: Mentor[]): Promise<void> {
    for (const mentor of mentores) this.itens.set(mentor.id, clonar(mentor));
  }

  async contar(): Promise<number> {
    return this.itens.size;
  }

  async verificarSaude(): Promise<boolean> {
    return true;
  }
}
