import type { Avaliacao, CriarAvaliacaoInput } from '../../mentores/domain/mentor';
import { naoEncontrado } from '../../mentores/domain/errors';
import { adicionarAvaliacao } from '../domain/avaliacoes';
import type { MentorRepository } from '../../mentores/application/MentorRepository';

export async function addAvaliacao(
  repo: MentorRepository,
  mentorId: string,
  input: CriarAvaliacaoInput,
  agora: string = new Date().toISOString(),
): Promise<Avaliacao> {
  const mentor = await repo.buscarPorId(mentorId);
  if (!mentor) throw naoEncontrado('Mentor');

  const { mentor: atualizado, avaliacao } = adicionarAvaliacao(mentor, input, agora);
  const persistido = await repo.atualizar(atualizado);
  if (!persistido) throw naoEncontrado('Mentor');
  return avaliacao;
}
