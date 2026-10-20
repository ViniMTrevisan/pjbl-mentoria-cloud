import type {
  EventoDominio,
  EventoPendente,
  Sessao,
  SessaoStatus,
  TipoEvento,
} from './sessao';
import { gerarId } from './texto';

export const SOURCE = 'sessoes-service';

export function criarEvento(
  tipo: TipoEvento,
  data: Record<string, unknown>,
  agora: string,
): EventoDominio {
  return {
    id: gerarId('ev'),
    type: tipo,
    source: SOURCE,
    time: agora,
    data,
  };
}

/**
 * Payload por tipo, conforme contrato:
 * solicitada/concluida carregam participantes; as demais carregam ator e statusAnterior.
 */
export function eventoDeSessao(
  tipo: TipoEvento,
  sessao: Sessao,
  agora: string,
  extras: { atorId?: string; statusAnterior?: SessaoStatus } = {},
): EventoDominio {
  switch (tipo) {
    case 'SessaoSolicitada':
      return criarEvento(
        tipo,
        {
          sessaoId: sessao.id,
          mentorId: sessao.mentorId,
          mentoradoId: sessao.mentoradoId,
          dataHora: sessao.dataHora,
        },
        agora,
      );
    case 'SessaoConcluida':
      return criarEvento(
        tipo,
        {
          sessaoId: sessao.id,
          mentorId: sessao.mentorId,
          mentoradoId: sessao.mentoradoId,
        },
        agora,
      );
    default:
      return criarEvento(
        tipo,
        {
          sessaoId: sessao.id,
          ator: extras.atorId,
          statusAnterior: extras.statusAnterior,
        },
        agora,
      );
  }
}

export function paraPendente(evento: EventoDominio, sessaoId: string): EventoPendente {
  return {
    id: evento.id,
    tipo: evento.type,
    sessaoId,
    payload: JSON.stringify(evento),
    criadoEm: evento.time,
    publicadoEm: null,
  };
}
