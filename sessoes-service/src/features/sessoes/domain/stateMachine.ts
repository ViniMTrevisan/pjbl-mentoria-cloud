import type { Sessao, SessaoAcao, SessaoStatus, TipoEvento } from './sessao';
import { ACOES_SESSAO } from './sessao';
import { conflito, dadosInvalidos, proibido } from './errors';

export interface ResultadoTransicao {
  sessao: Sessao;
  statusAnterior: SessaoStatus;
  tipoEvento: TipoEvento;
}

const DESTINO: Record<SessaoAcao, { status: SessaoStatus; tipoEvento: TipoEvento }> = {
  aceitar: { status: 'ACEITA', tipoEvento: 'SessaoAceita' },
  recusar: { status: 'RECUSADA', tipoEvento: 'SessaoRecusada' },
  cancelar: { status: 'CANCELADA', tipoEvento: 'SessaoCancelada' },
  concluir: { status: 'CONCLUIDA', tipoEvento: 'SessaoConcluida' },
};

function transicaoInvalida(atual: SessaoStatus, acao: SessaoAcao): never {
  throw conflito(`transicao invalida: ${atual} nao aceita ${acao}`);
}

/**
 * Maquina de estados do contrato:
 * aceitar/recusar = SOLICITADA + mentor; cancelar = SOLICITADA|ACEITA + participante;
 * concluir = ACEITA + participante.
 */
export function aplicarAcao(
  sessao: Sessao,
  acao: SessaoAcao,
  atorId: string,
  agora: string,
): ResultadoTransicao {
  if (!(ACOES_SESSAO as readonly string[]).includes(acao)) {
    throw dadosInvalidos({ acao: `deve ser uma de ${ACOES_SESSAO.join(', ')}` });
  }

  const participante = atorId === sessao.mentorId || atorId === sessao.mentoradoId;
  if (!participante) throw proibido('ator nao participa da sessao');

  switch (acao) {
    case 'aceitar':
    case 'recusar':
      if (atorId !== sessao.mentorId) {
        throw proibido('somente o mentor pode aceitar ou recusar');
      }
      if (sessao.status !== 'SOLICITADA') transicaoInvalida(sessao.status, acao);
      break;
    case 'cancelar':
      if (sessao.status !== 'SOLICITADA' && sessao.status !== 'ACEITA') {
        transicaoInvalida(sessao.status, acao);
      }
      break;
    case 'concluir':
      if (sessao.status !== 'ACEITA') transicaoInvalida(sessao.status, acao);
      break;
    default:
      throw dadosInvalidos({ acao: 'acao desconhecida' });
  }

  const destino = DESTINO[acao];
  return {
    sessao: { ...sessao, status: destino.status, atualizadaEm: agora },
    statusAnterior: sessao.status,
    tipoEvento: destino.tipoEvento,
  };
}
