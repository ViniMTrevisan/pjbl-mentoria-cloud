import type { Sessao } from '../domain/sessao';
import { naoEncontrado } from '../domain/errors';
import type { SessaoRepository } from './SessaoRepository';

export async function getSessao(repo: SessaoRepository, id: string): Promise<Sessao> {
  const sessao = await repo.buscarPorId(id);
  if (!sessao) throw naoEncontrado('Sessao');
  return sessao;
}
