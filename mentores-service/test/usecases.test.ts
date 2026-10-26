import { describe, expect, it } from 'vitest';
import { DomainError } from '../src/features/mentores/domain/errors';
import { addAvaliacao } from '../src/features/avaliacoes/application/addAvaliacao';
import { createMentor } from '../src/features/mentores/application/createMentor';
import { deleteMentor } from '../src/features/mentores/application/deleteMentor';
import { getMentor } from '../src/features/mentores/application/getMentor';
import { listMentores } from '../src/features/mentores/application/listMentores';
import { updateMentor } from '../src/features/mentores/application/updateMentor';
import { InMemoryMentorRepository } from '../src/features/mentores/infrastructure/InMemoryMentorRepository';

const AGORA = '2026-10-20T12:00:00.000Z';

function repoVazio(): InMemoryMentorRepository {
  return new InMemoryMentorRepository([]);
}

const entrada = {
  nome: 'Ana Beatriz Moraes',
  email: 'ana.moraes@pucpr.br',
  curso: 'Engenharia de Software',
  periodo: 7,
  bio: 'Monitora de Estrutura de Dados.',
  areas: [{ curso: 'Engenharia de Software', materia: 'Estrutura de Dados' }],
  disponibilidades: [{ diaSemana: 1, horaInicio: '14:00', horaFim: '16:00' }],
};

async function capturarErro(acao: Promise<unknown>): Promise<DomainError> {
  try {
    await acao;
  } catch (erro) {
    if (erro instanceof DomainError) return erro;
    throw erro;
  }
  throw new Error('esperava DomainError');
}

describe('createMentor', () => {
  it('cria mentor e o devolve na listagem', async () => {
    const repo = repoVazio();
    const criado = await createMentor(repo, entrada, AGORA);

    expect(criado.id).toBeTruthy();
    expect(criado.criadoEm).toBe(AGORA);

    const lista = await listMentores(repo, {});
    expect(lista.total).toBe(1);
    expect(lista.itens[0]?.nome).toBe('Ana Beatriz Moraes');
    expect(lista.itens[0]?.notas).toEqual([]);
  });

  it('recusa dados invalidos com 422 e nao persiste', async () => {
    const repo = repoVazio();
    const erro = await capturarErro(
      createMentor(repo, { nome: '', email: 'x' }, AGORA),
    );

    expect(erro.status).toBe(422);
    expect(erro.campos?.nome).toBeDefined();
    expect(await repo.contar()).toBe(0);
  });

  it('nao lista mentor sem area (regra do catalogo)', async () => {
    const repo = repoVazio();
    await createMentor(repo, { nome: 'Sem Area', email: 'sem@pucpr.br' }, AGORA);

    expect(await repo.contar()).toBe(1);
    expect((await listMentores(repo, {})).total).toBe(0);
  });
});

describe('getMentor e updateMentor', () => {
  it('retorna 404 quando o mentor nao existe', async () => {
    const repo = repoVazio();
    expect((await capturarErro(getMentor(repo, 'u99'))).status).toBe(404);
    expect((await capturarErro(updateMentor(repo, 'u99', { bio: 'x' }, AGORA))).status).toBe(404);
  });

  it('atualiza somente os campos enviados', async () => {
    const repo = repoVazio();
    const criado = await createMentor(repo, entrada, AGORA);

    const atualizado = await updateMentor(
      repo,
      criado.id,
      { bio: 'Nova bio', periodo: 8 },
      '2026-10-21T12:00:00.000Z',
    );

    expect(atualizado.bio).toBe('Nova bio');
    expect(atualizado.periodo).toBe(8);
    expect(atualizado.nome).toBe(criado.nome);
    expect(atualizado.atualizadoEm).toBe('2026-10-21T12:00:00.000Z');
  });

  it('recusa patch invalido com 422', async () => {
    const repo = repoVazio();
    const criado = await createMentor(repo, entrada, AGORA);
    const erro = await capturarErro(
      updateMentor(repo, criado.id, { periodo: 20 }, AGORA),
    );
    expect(erro.status).toBe(422);
  });
});

describe('addAvaliacao', () => {
  it('registra avaliacao e reflete nas notas do resumo', async () => {
    const repo = repoVazio();
    const criado = await createMentor(repo, entrada, AGORA);

    const avaliacao = await addAvaliacao(repo, criado.id, {
      sessaoId: 's1',
      nota: 5,
      comentario: 'Otima!',
    }, AGORA);

    expect(avaliacao.sessaoId).toBe('s1');
    const lista = await listMentores(repo, {});
    expect(lista.itens[0]?.notas).toEqual([5]);
    expect(lista.itens[0]?.totalAvaliacoes).toBe(1);
  });

  it('retorna 409 na avaliacao duplicada da mesma sessao', async () => {
    const repo = repoVazio();
    const criado = await createMentor(repo, entrada, AGORA);
    await addAvaliacao(repo, criado.id, { sessaoId: 's1', nota: 4 }, AGORA);

    const erro = await capturarErro(
      addAvaliacao(repo, criado.id, { sessaoId: 's1', nota: 5 }, AGORA),
    );
    expect(erro.status).toBe(409);
  });

  it('retorna 404 ao avaliar mentor inexistente', async () => {
    const repo = repoVazio();
    const erro = await capturarErro(
      addAvaliacao(repo, 'u99', { sessaoId: 's1', nota: 5 }, AGORA),
    );
    expect(erro.status).toBe(404);
  });
});

describe('deleteMentor', () => {
  it('remove e depois responde 404', async () => {
    const repo = repoVazio();
    const criado = await createMentor(repo, entrada, AGORA);

    await deleteMentor(repo, criado.id);
    expect(await repo.contar()).toBe(0);
    expect((await capturarErro(deleteMentor(repo, criado.id))).status).toBe(404);
  });
});

describe('listMentores com filtros', () => {
  it('aplica curso, materia e q', async () => {
    const repo = repoVazio();
    await createMentor(repo, entrada, AGORA);
    await createMentor(
      repo,
      {
        nome: 'Joao Vitor Salles',
        email: 'joao.salles@pucpr.br',
        bio: 'Banco de dados e modelagem.',
        areas: [{ curso: 'Sistemas de Informacao', materia: 'Banco de Dados' }],
      },
      AGORA,
    );

    expect((await listMentores(repo, { curso: 'engenharia' })).total).toBe(1);
    expect((await listMentores(repo, { materia: 'banco' })).total).toBe(1);
    expect((await listMentores(repo, { q: 'modelagem' })).total).toBe(1);
    expect((await listMentores(repo, { q: 'nada' })).total).toBe(0);
  });
});
