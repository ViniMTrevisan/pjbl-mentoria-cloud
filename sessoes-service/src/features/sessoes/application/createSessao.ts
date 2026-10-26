import type { Sessao } from '../domain/sessao';
import { dadosInvalidos } from '../domain/errors';
import { eventoDeSessao, paraPendente } from '../domain/events';
import { gerarId } from '../domain/texto';
import { validarCriacao } from '../domain/validation';
import type { SessaoRepository } from './SessaoRepository';

export async function createSessao(
  repo: SessaoRepository,
  dados: unknown,
  agora: string = new Date().toISOString(),
): Promise<Sessao> {
  const validacao = validarCriacao(dados, agora);
  if (!validacao.ok) throw dadosInvalidos(validacao.campos);

  const sessao: Sessao = {
    id: gerarId('s'),
    ...validacao.valor,
    status: 'SOLICITADA',
    criadaEm: agora,
    atualizadaEm: agora,
  };

  const evento = paraPendente(
    eventoDeSessao('SessaoSolicitada', sessao, agora),
    sessao.id,
  );

  return repo.criar(sessao, evento);
}
