import { Router } from 'express';
import type { ServicoRemoto } from '../../../shared/application/ServicoRemoto';
import { criarProxyHandler } from '../../../shared/http/proxy';

/** Slice `eventos`: leitura do sink de eventos de domínio exposto pela Function. */
export function eventosRoutes(proxy: ServicoRemoto): Router {
  const router = Router();

  router.get(
    '/eventos',
    criarProxyHandler(proxy, { metodo: 'GET', caminho: () => '/api/eventos' }),
  );

  return router;
}
