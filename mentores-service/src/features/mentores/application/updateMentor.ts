import type { AtualizarMentorInput, Mentor } from '../domain/mentor';
import { dadosInvalidos, naoEncontrado } from '../domain/errors';
import { aplicarAlteracoes } from '../domain/mentorFactory';
import type { MentorRepository } from './MentorRepository';

export async function updateMentor(
  repo: MentorRepository,
  id: string,
  patch: AtualizarMentorInput,
  agora: string = new Date().toISOString(),
): Promise<Mentor> {
  const atual = await repo.buscarPorId(id);
  if (!atual) throw naoEncontrado('Mentor');

  const resultado = aplicarAlteracoes(atual, patch, agora);
  if (!resultado.ok) throw dadosInvalidos(resultado.campos);

  const atualizado = await repo.atualizar(resultado.valor);
  if (!atualizado) throw naoEncontrado('Mentor');
  return atualizado;
}
