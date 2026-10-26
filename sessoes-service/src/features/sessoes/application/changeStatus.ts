import type { Sessao, SessaoAcao } from '../domain/sessao';
import { conflito, naoEncontrado } from '../domain/errors';
import { eventoDeSessao, paraPendente } from '../domain/events';
import { aplicarAcao } from '../domain/stateMachine';
import type { SessaoRepository } from './SessaoRepository';

export async function changeStatus(
  repo: SessaoRepository,
  id: string,
  acao: SessaoAcao,
  atorId: string,
  agora: string = new Date().toISOString(),
): Promise<Sessao> {
  const sessao = await repo.buscarPorId(id);
  if (!sessao) throw naoEncontrado('Sessao');

  const transicao = aplicarAcao(sessao, acao, atorId, agora);
  const evento = paraPendente(
    eventoDeSessao(transicao.tipoEvento, transicao.sessao, agora, {
      atorId,
      statusAnterior: transicao.statusAnterior,
    }),
    id,
  );

  const atualizada = await repo.atualizarStatus(
    id,
    transicao.statusAnterior,
    transicao.sessao.status,
    evento,
    agora,
  );

  if (!atualizada) throw conflito('sessao alterada por outra requisicao');
  return atualizada;
}
