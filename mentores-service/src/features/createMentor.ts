import type { Mentor } from '../domain/mentor';
import { dadosInvalidos } from '../domain/errors';
import { novoMentor } from '../domain/mentorFactory';
import { validarMentor } from '../domain/validation';
import type { MentorRepository } from '../ports/MentorRepository';

export async function createMentor(
  repo: MentorRepository,
  dados: unknown,
  agora: string = new Date().toISOString(),
): Promise<Mentor> {
  const validacao = validarMentor(dados);
  if (!validacao.ok) throw dadosInvalidos(validacao.campos);
  return repo.criar(novoMentor(validacao.valor, agora));
}
