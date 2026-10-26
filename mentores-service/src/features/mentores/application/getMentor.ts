import type { Mentor } from '../domain/mentor';
import { naoEncontrado } from '../domain/errors';
import type { MentorRepository } from './MentorRepository';

export async function getMentor(repo: MentorRepository, id: string): Promise<Mentor> {
  const mentor = await repo.buscarPorId(id);
  if (!mentor) throw naoEncontrado('Mentor');
  return mentor;
}
