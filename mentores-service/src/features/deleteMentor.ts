import { naoEncontrado } from '../domain/errors';
import type { MentorRepository } from '../ports/MentorRepository';

export async function deleteMentor(repo: MentorRepository, id: string): Promise<void> {
  const removido = await repo.remover(id);
  if (!removido) throw naoEncontrado('Mentor');
}
