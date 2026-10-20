import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Saude } from '../domain/types';
import type { Config } from '../infrastructure/config';
import type { ServicoProxy } from '../infrastructure/clients/servicoProxy';
import {
  getAggregatedData,
  type AgregacaoDeps,
} from '../application/use-cases/getAggregatedData';
import { criarProxyHandler } from './proxy';
import { resolverUsuarioId } from './usuario';

export interface RotasDeps {
  config: Config;
  agregacao: AgregacaoDeps;
  proxyMentores: ServicoProxy;
  proxySessoes: ServicoProxy;
  proxyFunction: ServicoProxy;
}

const id = (req: Request): string => encodeURIComponent(String(req.params.id ?? ''));

export function criarRotas(deps: RotasDeps): Router {
  const router = Router();

  // ---------- agregação ----------
  router.get('/aggregated-data', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = resolverUsuarioId(req);
      const dados = await getAggregatedData(deps.agregacao, {
        usuarioId,
        timeoutMs: deps.config.HTTP_TIMEOUT_MS,
      });
      res.status(200).json(dados);
    } catch (erro) {
      next(erro);
    }
  });

  // ---------- mentores ----------
  const proxyMentores = deps.proxyMentores;
  router.get(
    '/mentores',
    criarProxyHandler(proxyMentores, { metodo: 'GET', caminho: () => '/mentores' }),
  );
  router.post(
    '/mentores',
    criarProxyHandler(proxyMentores, { metodo: 'POST', caminho: () => '/mentores' }),
  );
  router.get(
    '/mentores/:id',
    criarProxyHandler(proxyMentores, { metodo: 'GET', caminho: (req) => `/mentores/${id(req)}` }),
  );
  router.put(
    '/mentores/:id',
    criarProxyHandler(proxyMentores, { metodo: 'PUT', caminho: (req) => `/mentores/${id(req)}` }),
  );
  router.delete(
    '/mentores/:id',
    criarProxyHandler(proxyMentores, {
      metodo: 'DELETE',
      caminho: (req) => `/mentores/${id(req)}`,
    }),
  );
  router.post(
    '/mentores/:id/avaliacoes',
    criarProxyHandler(proxyMentores, {
      metodo: 'POST',
      caminho: (req) => `/mentores/${id(req)}/avaliacoes`,
    }),
  );

  // ---------- sessões ----------
  const proxySessoes = deps.proxySessoes;
  router.get(
    '/sessoes',
    criarProxyHandler(proxySessoes, {
      metodo: 'GET',
      caminho: () => '/sessoes',
      usuarioIdNaQuery: true,
    }),
  );
  router.post(
    '/sessoes',
    criarProxyHandler(proxySessoes, { metodo: 'POST', caminho: () => '/sessoes' }),
  );
  router.get(
    '/sessoes/:id',
    criarProxyHandler(proxySessoes, { metodo: 'GET', caminho: (req) => `/sessoes/${id(req)}` }),
  );
  router.patch(
    '/sessoes/:id/status',
    criarProxyHandler(proxySessoes, {
      metodo: 'PATCH',
      caminho: (req) => `/sessoes/${id(req)}/status`,
    }),
  );

  // ---------- eventos ----------
  router.get(
    '/eventos',
    criarProxyHandler(deps.proxyFunction, { metodo: 'GET', caminho: () => '/api/eventos' }),
  );

  // ---------- operação ----------
  router.get('/health', async (_req: Request, res: Response) => {
    const orcamento = deps.config.HEALTH_TIMEOUT_MS;
    const [mentores, sessoes, funcao] = await Promise.all([
      deps.proxyMentores.disponivel('/health', orcamento),
      deps.proxySessoes.disponivel('/health', orcamento),
      deps.proxyFunction.disponivel('/api/health', orcamento),
    ]);

    const saude: Saude = {
      status: mentores && sessoes && funcao ? 'ok' : 'degradado',
      dependencias: {
        mentores: mentores ? 'ok' : 'fora',
        sessoes: sessoes ? 'ok' : 'fora',
        function: funcao ? 'ok' : 'fora',
      },
    };

    res.status(200).json(saude);
  });

  return router;
}
