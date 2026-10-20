import { describe, expect, it } from 'vitest';
import type { Mentor } from '../src/domain/mentor';
import { DomainError } from '../src/domain/errors';
import { validarMentor, filtrarMentores, toResumo } from '../src/domain/validation';
import { novoMentor, aplicarAlteracoes, camposAlterados } from '../src/domain/mentorFactory';
import { adicionarAvaliacao } from '../src/domain/avaliacoes';

const AGORA = '2026-10-20T12:00:00.000Z';

function mentor(sobrescreve: Partial<Mentor> = {}): Mentor {
  return {
    id: 'u2',
    nome: 'Ana Beatriz Moraes',
    email: 'ana.moraes@pucpr.br',
    curso: 'Engenharia de Software',
    periodo: 7,
    bio: 'Monitora de Estrutura de Dados e Cloud.',
    ehMentor: true,
    ehMentorado: false,
    areas: [
      { id: 'a1', curso: 'Engenharia de Software', materia: 'Estrutura de Dados' },
    ],
    disponibilidades: [
      { id: 'd1', diaSemana: 1, horaInicio: '14:00', horaFim: '16:00' },
    ],
    avaliacoes: [],
    criadoEm: AGORA,
    atualizadoEm: AGORA,
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

describe('validarMentor', () => {
  it('aceita mentor completo e aplica defaults de papel', () => {
    const resultado = validarMentor({
      nome: '  Ana Beatriz  ',
      email: 'ANA@PUCPR.BR',
      curso: 'Engenharia de Software',
      periodo: 7,
      areas: [{ curso: 'Engenharia de Software', materia: 'Estrutura de Dados' }],
    });

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.nome).toBe('Ana Beatriz');
    expect(resultado.valor.email).toBe('ana@pucpr.br');
    expect(resultado.valor.ehMentor).toBe(true);
    expect(resultado.valor.ehMentorado).toBe(false);
  });

  it('exige nome e email com formato valido', () => {
    const resultado = validarMentor({ nome: ' ', email: 'invalido' });
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.campos.nome).toBeDefined();
    expect(resultado.campos.email).toBeDefined();
  });

  it('rejeita periodo fora de 1..12 e nao inteiro', () => {
    for (const periodo of [0, 13, 2.5]) {
      const resultado = validarMentor({
        nome: 'Ana',
        email: 'ana@pucpr.br',
        periodo,
      });
      expect(resultado.ok).toBe(false);
      if (resultado.ok) continue;
      expect(resultado.campos.periodo).toBe('inteiro de 1 a 12');
    }
  });

  it('valida shape de areas e disponibilidades', () => {
    const resultado = validarMentor({
      nome: 'Ana',
      email: 'ana@pucpr.br',
      areas: [{ curso: '', materia: 'Estrutura' }],
      disponibilidades: [{ diaSemana: 7, horaInicio: '25:00', horaFim: '08:00' }],
    });
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.campos['areas.0.curso']).toBeDefined();
    expect(resultado.campos['disponibilidades.0.diaSemana']).toBeDefined();
    expect(resultado.campos['disponibilidades.0.horaInicio']).toBeDefined();
  });

  it('rejeita corpo que nao e objeto', () => {
    const resultado = validarMentor(['nome']);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.campos.corpo).toBeDefined();
  });
});

describe('novoMentor', () => {
  it('gera ids de area/disponibilidade e timestamps iguais', () => {
    const validado = validarMentor({
      nome: 'Ana',
      email: 'ana@pucpr.br',
      areas: [{ curso: 'ES', materia: 'ED' }],
      disponibilidades: [{ diaSemana: 2, horaInicio: '10:00', horaFim: '12:00' }],
    });
    if (!validado.ok) throw new Error('fixture invalida');

    const criado = novoMentor(validado.valor, AGORA);

    expect(criado.id).toMatch(/^m/);
    expect(criado.areas[0]?.id).toMatch(/^a/);
    expect(criado.disponibilidades[0]?.id).toMatch(/^d/);
    expect(criado.avaliacoes).toEqual([]);
    expect(criado.criadoEm).toBe(AGORA);
    expect(criado.atualizadoEm).toBe(AGORA);
  });
});

describe('adicionarAvaliacao', () => {
  it('adiciona avaliacao valida e atualiza o timestamp', () => {
    const { mentor: atualizado, avaliacao } = adicionarAvaliacao(
      mentor(),
      { sessaoId: 's1', nota: 5, comentario: ' Otima! ' },
      AGORA,
    );

    expect(avaliacao.nota).toBe(5);
    expect(avaliacao.comentario).toBe('Otima!');
    expect(atualizado.avaliacoes).toHaveLength(1);
    expect(atualizado.atualizadoEm).toBe(AGORA);
  });

  it('rejeita nota fora de 1..5 e sessaoId vazio com 422', () => {
    for (const nota of [0, 6, 4.5]) {
      const erro = capturarErro(() =>
        adicionarAvaliacao(mentor(), { sessaoId: 's1', nota }, AGORA),
      );
      expect(erro.status).toBe(422);
      expect(erro.campos?.nota).toBeDefined();
    }

    const semSessao = capturarErro(() =>
      adicionarAvaliacao(mentor(), { sessaoId: '  ', nota: 5 }, AGORA),
    );
    expect(semSessao.status).toBe(422);
    expect(semSessao.campos?.sessaoId).toBeDefined();
  });

  it('bloqueia avaliacao duplicada da mesma sessao com 409', () => {
    const base = mentor({
      avaliacoes: [
        { id: 'av1', sessaoId: 's1', nota: 4, criadaEm: AGORA },
      ],
    });

    const erro = capturarErro(() =>
      adicionarAvaliacao(base, { sessaoId: 's1', nota: 5 }, AGORA),
    );
    expect(erro.status).toBe(409);
  });
});

describe('filtrarMentores', () => {
  const semArea = mentor({ id: 'u9', areas: [] });
  const naoMentor = mentor({ id: 'u8', ehMentor: false });
  const semAcento = mentor({
    id: 'u3',
    nome: 'Joao Vitor Salles',
    bio: 'Banco de dados e modelagem',
    areas: [{ id: 'a9', curso: 'Sistemas de Informacao', materia: 'Banco de Dados' }],
  });

  it('so lista mentores ativos com ao menos uma area', () => {
    const itens = filtrarMentores([mentor(), semArea, naoMentor], {});
    expect(itens.map((item) => item.id)).toEqual(['u2']);
  });

  it('filtra por curso/materia sem diferenciar caixa ou acentos', () => {
    const porCurso = filtrarMentores([mentor(), semAcento], { curso: 'informacao' });
    expect(porCurso.map((item) => item.id)).toEqual(['u3']);

    const porMateria = filtrarMentores([mentor(), semAcento], { materia: 'ESTRUTURA' });
    expect(porMateria.map((item) => item.id)).toEqual(['u2']);
  });

  it('busca textual em nome, bio e materia', () => {
    expect(filtrarMentores([mentor(), semAcento], { q: 'joao' })).toHaveLength(1);
    expect(filtrarMentores([mentor(), semAcento], { q: 'modelagem' })).toHaveLength(1);
    expect(filtrarMentores([mentor(), semAcento], { q: 'banco de dados' })).toHaveLength(1);
    expect(filtrarMentores([mentor(), semAcento], { q: 'inexistente' })).toHaveLength(0);
  });
});

describe('atualizacao parcial', () => {
  it('mantem campos nao enviados e preserva ids existentes', () => {
    const atual = mentor();
    const resultado = aplicarAlteracoes(atual, { bio: 'Nova bio' }, AGORA);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.bio).toBe('Nova bio');
    expect(resultado.valor.nome).toBe(atual.nome);
    expect(resultado.valor.areas[0]?.id).toBe('a1');
    expect(resultado.valor.criadoEm).toBe(AGORA);
  });

  it('revalida o documento completo no patch', () => {
    const resultado = aplicarAlteracoes(mentor(), { email: 'sem-arroba' }, AGORA);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.campos.email).toBeDefined();
  });

  it('lista apenas os campos alterados', () => {
    const atual = mentor();
    const resultado = aplicarAlteracoes(atual, { bio: 'Outra', periodo: 8 }, AGORA);
    if (!resultado.ok) throw new Error('esperava sucesso');

    expect(camposAlterados(atual, resultado.valor).sort()).toEqual(['bio', 'periodo']);
  });
});

describe('toResumo', () => {
  it('extrai notas e total de avaliacoes', () => {
    const resumo = toResumo(
      mentor({
        avaliacoes: [
          { id: 'av1', sessaoId: 's1', nota: 5, criadaEm: AGORA },
          { id: 'av2', sessaoId: 's2', nota: 3, criadaEm: AGORA },
        ],
      }),
    );

    expect(resumo.notas).toEqual([5, 3]);
    expect(resumo.totalAvaliacoes).toBe(2);
    expect(Object.keys(resumo)).not.toContain('email');
  });
});
