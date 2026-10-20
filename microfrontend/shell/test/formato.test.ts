import { describe, expect, it } from 'vitest';
import { blocoDeData, formatarData, statusLabel } from '../src/lib/formato';
import { separarSessoes } from '../src/lib/sessoes';
import type { Sessao } from '../src/types';

function sessao(parcial: Partial<Sessao> & { id: string; dataHora: string }): Sessao {
  return {
    mentorId: 'u2',
    mentoradoId: 'u1',
    mentorNome: 'Ana Beatriz Moraes',
    mentoradoNome: 'Bruno Calouro',
    assunto: 'Dúvida',
    status: 'SOLICITADA',
    criadaEm: '2026-10-19T12:00:00.000Z',
    atualizadaEm: '2026-10-19T12:00:00.000Z',
    ...parcial,
  };
}

describe('formatarData', () => {
  it('converte UTC para o horário de São Paulo', () => {
    expect(formatarData('2026-10-22T17:00:00.000Z')).toBe('22/10/2026 14:00');
  });

  it('vira a data quando o horário UTC passa das 21h', () => {
    expect(formatarData('2026-10-23T01:30:00.000Z')).toBe('22/10/2026 22:30');
  });

  it('devolve texto seguro para data inválida', () => {
    expect(formatarData('não é data')).toBe('data inválida');
  });

  it('monta o bloco dia/mês/semana em pt-BR', () => {
    const bloco = blocoDeData('2026-10-22T17:00:00.000Z');
    expect(bloco.dia).toBe('22');
    expect(bloco.mes.toLowerCase()).toContain('out');
    expect(bloco.semana.toLowerCase()).toContain('qui');
  });
});

describe('statusLabel', () => {
  it('traduz os cinco estados do contrato', () => {
    expect(statusLabel('SOLICITADA')).toBe('Aguardando resposta');
    expect(statusLabel('ACEITA')).toBe('Confirmada');
    expect(statusLabel('RECUSADA')).toBe('Recusada');
    expect(statusLabel('CONCLUIDA')).toBe('Concluída');
    expect(statusLabel('CANCELADA')).toBe('Cancelada');
  });

  it('não esconde um status desconhecido', () => {
    expect(statusLabel('EM_ANALISE')).toBe('EM_ANALISE');
  });
});

describe('separarSessoes', () => {
  const agora = new Date('2026-10-20T18:00:00.000Z');

  it('mantém futuras e abertas em próximas, em ordem ascendente', () => {
    const resultado = separarSessoes(
      [
        sessao({ id: 'b', dataHora: '2026-10-25T17:00:00.000Z', status: 'ACEITA' }),
        sessao({ id: 'a', dataHora: '2026-10-22T17:00:00.000Z' }),
      ],
      agora,
    );
    expect(resultado.proximas.map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('joga passadas e encerradas no histórico, em ordem descendente', () => {
    const resultado = separarSessoes(
      [
        sessao({ id: 'velha', dataHora: '2026-10-10T17:00:00.000Z', status: 'CONCLUIDA' }),
        sessao({ id: 'cancelada', dataHora: '2026-10-26T17:00:00.000Z', status: 'CANCELADA' }),
        sessao({ id: 'passada', dataHora: '2026-10-19T17:00:00.000Z' }),
      ],
      agora,
    );
    expect(resultado.proximas).toEqual([]);
    expect(resultado.historico.map((s) => s.id)).toEqual(['cancelada', 'passada', 'velha']);
  });

  it('trata o instante de corte como ainda futuro', () => {
    const resultado = separarSessoes(
      [sessao({ id: 'agora', dataHora: agora.toISOString() })],
      agora,
    );
    expect(resultado.proximas).toHaveLength(1);
  });

  it('coloca data inválida no histórico em vez de quebrar a tela', () => {
    const resultado = separarSessoes([sessao({ id: 'ruim', dataHora: 'xxx' })], agora);
    expect(resultado.historico.map((s) => s.id)).toEqual(['ruim']);
  });
});
