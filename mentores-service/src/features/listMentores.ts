import type { FiltroMentores, MentorResumo } from '../domain/mentor';
import { filtrarMentores, toResumo } from '../domain/validation';
import type { MentorRepository } from '../ports/MentorRepository';

export async function listMentores(
  repo: MentorRepository,
  filtro: FiltroMentores,
): Promise<{ total: number; itens: MentorResumo[] }> {
  const mentores = await repo.listar();
  const itens = filtrarMentores(mentores, filtro).map(toResumo);
  return { total: itens.length, itens };
}
