import type { FiltroSessoes, Sessao } from '../domain/sessao';
import type { SessaoRepository } from '../ports/SessaoRepository';

export async function listSessoes(
  repo: SessaoRepository,
  filtro: FiltroSessoes,
): Promise<{ total: number; itens: Sessao[] }> {
  const itens = await repo.listar(filtro);
  return { total: itens.length, itens };
}
