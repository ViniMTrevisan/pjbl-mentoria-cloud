import { Router, type Request } from 'express';
import type { ServicoRemoto } from '../../../shared/application/ServicoRemoto';
import { criarProxyHandler } from '../../../shared/http/proxy';

const id = (req: Request): string => encodeURIComponent(String(req.params.id ?? ''));

/** Slice `mentores`: encaminha o contrato público de mentores ao serviço interno. */
export function mentoresRoutes(proxy: ServicoRemoto): Router {
  const router = Router();

  router.get('/mentores', criarProxyHandler(proxy, { metodo: 'GET', caminho: () => '/mentores' }));
  router.post('/mentores', criarProxyHandler(proxy, { metodo: 'POST', caminho: () => '/mentores' }));
  router.get(
    '/mentores/:id',
    criarProxyHandler(proxy, { metodo: 'GET', caminho: (req) => `/mentores/${id(req)}` }),
  );
  router.put(
    '/mentores/:id',
    criarProxyHandler(proxy, { metodo: 'PUT', caminho: (req) => `/mentores/${id(req)}` }),
  );
  router.delete(
    '/mentores/:id',
    criarProxyHandler(proxy, { metodo: 'DELETE', caminho: (req) => `/mentores/${id(req)}` }),
  );
  router.post(
    '/mentores/:id/avaliacoes',
    criarProxyHandler(proxy, {
      metodo: 'POST',
      caminho: (req) => `/mentores/${id(req)}/avaliacoes`,
    }),
  );

  return router;
}
