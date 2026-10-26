import { describe, expect, it } from 'vitest';
import type { Sessao } from '../src/features/sessoes/domain/sessao';
import { DomainError } from '../src/features/sessoes/domain/errors';
import { changeStatus } from '../src/features/sessoes/application/changeStatus';
import { createSessao } from '../src/features/sessoes/application/createSessao';
import { getSessao } from '../src/features/sessoes/application/getSessao';
import { listSessoes } from '../src/features/sessoes/application/listSessoes';
import { relayOutbox } from '../src/features/outbox/application/relayOutbox';
import { InMemorySessaoRepository } from '../src/features/sessoes/infrastructure/InMemorySessaoRepository';
import type { SessaoRepository } from '../src/features/sessoes/application/SessaoRepository';

const AGORA = '2026-10-20T12:00:00.000Z';
const FUTURO = '2026-10-22T17:00:00.000Z';

function repoSemSeed(): InMemorySessaoRepository {
  return new InMemorySessaoRepository([]);
}

const entrada = {
  mentorId: 'u2',
  mentoradoId: 'u1',
  mentorNome: 'Ana Beatriz Moraes',
  mentoradoNome: 'Bruno Calouro',
  dataHora: FUTURO,
  assunto: 'Dúvida em árvores binárias',
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

function sessaoBase(): Sessao {
  return {
    id: 's1',
    ...entrada,
    status: 'SOLICITADA',
    criadaEm: AGORA,
    atualizadaEm: AGORA,
  };
}

describe('createSessao', () => {
  it('cria SOLICITADA e enfileira SessaoSolicitada no outbox', async () => {
    const repo = repoSemSeed();
    const criada = await createSessao(repo, entrada, AGORA);

    expect(criada.status).toBe('SOLICITADA');
    expect(criada.id).toMatch(/^s/);
    expect(criada.criadaEm).toBe(AGORA);

    const pendentes = await repo.listarPendentes(20);
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0]?.tipo).toBe('SessaoSolicitada');
    expect(JSON.parse(pendentes[0]?.payload ?? '{}')).toMatchObject({
      type: 'SessaoSolicitada',
      data: { sessaoId: criada.id, mentorId: 'u2', mentoradoId: 'u1' },
    });

    const detalhe = await getSessao(repo, criada.id);
    expect(detalhe.assunto).toBe(entrada.assunto);
  });

  it('recusa criacao invalida com 422 e nao persiste', async () => {
    const repo = repoSemSeed();
    const erro = await capturarErro(
      createSessao(
        repo,
        { ...entrada, mentoradoId: 'u2', dataHora: '2026-01-01T10:00:00.000Z', assunto: 'x' },
        AGORA,
      ),
    );

    expect(erro.status).toBe(422);
    expect(erro.campos?.mentoradoId).toBeDefined();
    expect(erro.campos?.dataHora).toBeDefined();
    expect(erro.campos?.assunto).toBeDefined();
    expect(await repo.contar()).toBe(0);
  });
});

describe('listSessoes', () => {
  it('filtra por usuarioId e status', async () => {
    const repo = new InMemorySessaoRepository();
    const todas = await listSessoes(repo, {});
    expect(todas.total).toBe(4);

    const doMentorado = await listSessoes(repo, { usuarioId: 'u1' });
    expect(doMentorado.total).toBe(4);

    const daMentor = await listSessoes(repo, { usuarioId: 'u2' });
    expect(daMentor.total).toBe(1);

    const aceitas = await listSessoes(repo, { status: 'ACEITA' });
    expect(aceitas.total).toBe(1);
    expect(aceitas.itens[0]?.id).toBe('s2');

    const vazia = await listSessoes(repo, { usuarioId: 'u9' });
    expect(vazia.total).toBe(0);
  });
});

describe('changeStatus', () => {
  it('aceitar pelo mentor atualiza status e registra evento', async () => {
    const repo = repoSemSeed();
    const criada = await createSessao(repo, entrada, AGORA);

    const atualizada = await changeStatus(
      repo,
      criada.id,
      'aceitar',
      'u2',
      '2026-10-20T13:00:00.000Z',
    );

    expect(atualizada.status).toBe('ACEITA');
    expect(atualizada.atualizadaEm).toBe('2026-10-20T13:00:00.000Z');

    const pendentes = await repo.listarPendentes(20);
    expect(pendentes).toHaveLength(2);
    const eventoAceite = pendentes.find((evento) => evento.tipo === 'SessaoAceita');
    expect(eventoAceite).toBeDefined();
    expect(JSON.parse(eventoAceite?.payload ?? '{}').data).toMatchObject({
      ator: 'u2',
      statusAnterior: 'SOLICITADA',
    });
  });

  it('retorna 403 quando o mentorado tenta aceitar', async () => {
    const repo = repoSemSeed();
    const criada = await createSessao(repo, entrada, AGORA);

    const erro = await capturarErro(changeStatus(repo, criada.id, 'aceitar', 'u1', AGORA));
    expect(erro.status).toBe(403);
  });

  it('retorna 409 em transicao invalida', async () => {
    const repo = repoSemSeed();
    const criada = await createSessao(repo, entrada, AGORA);
    await changeStatus(repo, criada.id, 'aceitar', 'u2', AGORA);

    const erro = await capturarErro(changeStatus(repo, criada.id, 'aceitar', 'u2', AGORA));
    expect(erro.status).toBe(409);
  });

  it('retorna 404 para sessao inexistente', async () => {
    const repo = repoSemSeed();
    const erro = await capturarErro(changeStatus(repo, 's99', 'aceitar', 'u2', AGORA));
    expect(erro.status).toBe(404);
  });

  it('retorna 409 quando outra requisicao vence a corrida', async () => {
    const stale: SessaoRepository = {
      listar: async () => [],
      buscarPorId: async () => sessaoBase(),
      criar: async (sessao: Sessao) => sessao,
      atualizarStatus: async () => null,
      inserirVarios: async () => undefined,
      contar: async () => 1,
      verificarSaude: async () => true,
    };

    const erro = await capturarErro(changeStatus(stale, 's1', 'aceitar', 'u2', AGORA));
    expect(erro.status).toBe(409);
  });
});

describe('relayOutbox', () => {
  async function repoComEvento(): Promise<InMemorySessaoRepository> {
    const repo = repoSemSeed();
    await createSessao(repo, entrada, AGORA);
    return repo;
  }

  it('publica no sink e marca publicado', async () => {
    const repo = await repoComEvento();
    const urls: string[] = [];
    const fetchOk = (async (url: string | URL | Request) => {
      urls.push(String(url));
      return new Response('', { status: 202 });
    }) as unknown as typeof fetch;

    const resultado = await relayOutbox({
      outbox: repo,
      sinkUrl: 'http://sink:7071/',
      fetchImpl: fetchOk,
    });

    expect(resultado).toEqual({ publicados: 1, falhas: 0 });
    expect(urls).toEqual(['http://sink:7071/api/eventos']);
    expect(await repo.listarPendentes(20)).toHaveLength(0);
  });

  it('mantem pendente quando o sink esta fora', async () => {
    const repo = await repoComEvento();
    const fetchFora = (async () => {
      throw new Error('sink fora');
    }) as unknown as typeof fetch;

    const resultado = await relayOutbox({
      outbox: repo,
      sinkUrl: 'http://sink:7071',
      fetchImpl: fetchFora,
    });

    expect(resultado).toEqual({ publicados: 0, falhas: 1 });
    expect(await repo.listarPendentes(20)).toHaveLength(1);
  });

  it('mantem pendente quando o sink responde erro', async () => {
    const repo = await repoComEvento();
    const fetchErro = (async () => new Response('', { status: 503 })) as unknown as typeof fetch;

    const resultado = await relayOutbox({
      outbox: repo,
      sinkUrl: 'http://sink:7071',
      fetchImpl: fetchErro,
    });

    expect(resultado).toEqual({ publicados: 0, falhas: 1 });
    const pendentes = await repo.listarPendentes(20);
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0]?.publicadoEm).toBeNull();
  });
});
