import { naoEncontrado } from '../domain/errors';
import type { MentorRepository } from './MentorRepository';

export async function deleteMentor(repo: MentorRepository, id: string): Promise<void> {
  const removido = await repo.remover(id);
  if (!removido) throw naoEncontrado('Mentor');
}
