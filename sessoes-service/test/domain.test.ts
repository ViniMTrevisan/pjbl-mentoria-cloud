import { describe, expect, it } from 'vitest';
import type { Sessao } from '../src/features/sessoes/domain/sessao';
import { DomainError } from '../src/features/sessoes/domain/errors';
import { aplicarAcao } from '../src/features/sessoes/domain/stateMachine';
import { eventoDeSessao, paraPendente } from '../src/features/sessoes/domain/events';
import {
  normalizarFiltroStatus,
  parseStatus,
  validarCriacao,
} from '../src/features/sessoes/domain/validation';

const AGORA = '2026-10-20T12:00:00.000Z';
const FUTURO = '2026-10-22T17:00:00.000Z';

function sessao(sobrescreve: Partial<Sessao> = {}): Sessao {
  return {
    id: 's1',
    mentorId: 'u2',
    mentoradoId: 'u1',
    mentorNome: 'Ana Beatriz Moraes',
    mentoradoNome: 'Bruno Calouro',
    dataHora: FUTURO,
    assunto: 'Dúvida em árvores binárias',
    status: 'SOLICITADA',
    criadaEm: AGORA,
    atualizadaEm: AGORA,
    ...sobrescreve,
  };
}

function capturarErro(acao: () => unknown): DomainError {
  try {
    acao();
  } catch (erro) {
    if (erro instanceof DomainError) return erro;
    throw erro;
  }
  throw new Error('esperava DomainError');
}

describe('validarCriacao', () => {
  it('normaliza data para ISO UTC e usa nome do id quando ausente', () => {
    const resultado = validarCriacao(
      {
        mentorId: 'u2',
        mentoradoId: 'u1',
        dataHora: '2026-10-22T14:00:00-03:00',
        assunto: '  Dúvida em árvores binárias  ',
      },
      AGORA,
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.dataHora).toBe(FUTURO);
    expect(resultado.valor.assunto).toBe('Dúvida em árvores binárias');
    expect(resultado.valor.mentorNome).toBe('u2');
    expect(resultado.valor.mentoradoNome).toBe('u1');
  });

  it('exige participantes diferentes e obrigatorios', () => {
    const resultado = validarCriacao(
      { mentorId: 'u2', mentoradoId: 'u2', dataHora: FUTURO, assunto: 'Dúvida' },
      AGORA,
    );
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.campos.mentoradoId).toBeDefined();

    const semMentor = validarCriacao(
      { mentoradoId: 'u1', dataHora: FUTURO, assunto: 'Dúvida' },
      AGORA,
    );
    expect(semMentor.ok).toBe(false);
    if (semMentor.ok) return;
    expect(semMentor.campos.mentorId).toBeDefined();
  });

  it('rejeita data passada e data invalida', () => {
    for (const dataHora of ['2026-10-19T10:00:00.000Z', 'ontem']) {
      const resultado = validarCriacao(
        { mentorId: 'u2', mentoradoId: 'u1', dataHora, assunto: 'Dúvida' },
        AGORA,
      );
      expect(resultado.ok).toBe(false);
      if (resultado.ok) continue;
      expect(resultado.campos.dataHora).toBeDefined();
    }
  });

  it('rejeita assunto fora de 3..400 caracteres', () => {
    for (const assunto of ['ab', 'a'.repeat(401)]) {
      const resultado = validarCriacao(
        { mentorId: 'u2', mentoradoId: 'u1', dataHora: FUTURO, assunto },
        AGORA,
      );
      expect(resultado.ok).toBe(false);
      if (resultado.ok) continue;
      expect(resultado.campos.assunto).toBeDefined();
    }
  });

  it('rejeita corpo que nao e objeto', () => {
    const resultado = validarCriacao('texto', AGORA);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.campos.corpo).toBeDefined();
  });
});

describe('maquina de estados', () => {
  it('aceitar SOLICITADA pelo mentor vira ACEITA', () => {
    const resultado = aplicarAcao(sessao(), 'aceitar', 'u2', AGORA);
    expect(resultado.sessao.status).toBe('ACEITA');
    expect(resultado.statusAnterior).toBe('SOLICITADA');
    expect(resultado.tipoEvento).toBe('SessaoAceita');
    expect(resultado.sessao.atualizadaEm).toBe(AGORA);
  });

  it('recusar SOLICITADA pelo mentor vira RECUSADA', () => {
    const resultado = aplicarAcao(sessao(), 'recusar', 'u2', AGORA);
    expect(resultado.sessao.status).toBe('RECUSADA');
    expect(resultado.tipoEvento).toBe('SessaoRecusada');
  });

  it('bloqueia aceitar/recusar por quem nao e o mentor (403)', () => {
    const peloMentorado = capturarErro(() => aplicarAcao(sessao(), 'aceitar', 'u1', AGORA));
    expect(peloMentorado.status).toBe(403);

    const porEstranho = capturarErro(() => aplicarAcao(sessao(), 'aceitar', 'u9', AGORA));
    expect(porEstranho.status).toBe(403);
  });

  it('bloqueia transicoes invalidas com 409', () => {
    expect(
      capturarErro(() => aplicarAcao(sessao({ status: 'ACEITA' }), 'aceitar', 'u2', AGORA))
        .status,
    ).toBe(409);
    expect(
      capturarErro(() => aplicarAcao(sessao(), 'concluir', 'u2', AGORA)).status,
    ).toBe(409);
    expect(
      capturarErro(() => aplicarAcao(sessao({ status: 'CONCLUIDA' }), 'cancelar', 'u1', AGORA))
        .status,
    ).toBe(409);
  });

  it('cancelar SOLICITADA/ACEITA por qualquer participante', () => {
    expect(aplicarAcao(sessao(), 'cancelar', 'u1', AGORA).sessao.status).toBe('CANCELADA');
    expect(
      aplicarAcao(sessao({ status: 'ACEITA' }), 'cancelar', 'u2', AGORA).sessao.status,
    ).toBe('CANCELADA');
  });

  it('concluir ACEITA por qualquer participante', () => {
    const resultado = aplicarAcao(sessao({ status: 'ACEITA' }), 'concluir', 'u1', AGORA);
    expect(resultado.sessao.status).toBe('CONCLUIDA');
    expect(resultado.tipoEvento).toBe('SessaoConcluida');
  });

  it('rejeita acao desconhecida com 422', () => {
    const erro = capturarErro(() =>
      aplicarAcao(sessao(), 'aprovar' as 'aceitar', 'u2', AGORA),
    );
    expect(erro.status).toBe(422);
  });
});

describe('eventos de dominio', () => {
  it('SessaoSolicitada carrega participantes e dataHora', () => {
    const evento = eventoDeSessao('SessaoSolicitada', sessao(), AGORA);
    expect(evento.type).toBe('SessaoSolicitada');
    expect(evento.source).toBe('sessoes-service');
    expect(evento.time).toBe(AGORA);
    expect(evento.data).toEqual({
      sessaoId: 's1',
      mentorId: 'u2',
      mentoradoId: 'u1',
      dataHora: FUTURO,
    });

    const pendente = paraPendente(evento, 's1');
    expect(pendente.sessaoId).toBe('s1');
    expect(pendente.publicadoEm).toBeNull();
    expect(JSON.parse(pendente.payload)).toMatchObject({ type: 'SessaoSolicitada' });
  });

  it('Aceita/Recusada/Cancelada carregam ator e statusAnterior', () => {
    const evento = eventoDeSessao('SessaoAceita', sessao({ status: 'ACEITA' }), AGORA, {
      atorId: 'u2',
      statusAnterior: 'SOLICITADA',
    });
    expect(evento.data).toEqual({
      sessaoId: 's1',
      ator: 'u2',
      statusAnterior: 'SOLICITADA',
    });
  });

  it('SessaoConcluida carrega participantes', () => {
    const evento = eventoDeSessao('SessaoConcluida', sessao({ status: 'CONCLUIDA' }), AGORA, {
      atorId: 'u1',
      statusAnterior: 'ACEITA',
    });
    expect(evento.data).toEqual({ sessaoId: 's1', mentorId: 'u2', mentoradoId: 'u1' });
  });
});

describe('filtros', () => {
  it('aceita apenas status do contrato', () => {
    expect(parseStatus('ACEITA')).toBe('ACEITA');
    expect(parseStatus('aceita')).toBeNull();

    const campos: Record<string, string> = {};
    expect(normalizarFiltroStatus('INVALIDO', campos)).toBeUndefined();
    expect(campos.status).toBeDefined();

    const vazio: Record<string, string> = {};
    expect(normalizarFiltroStatus('', vazio)).toBeUndefined();
    expect(vazio).toEqual({});
  });
});
