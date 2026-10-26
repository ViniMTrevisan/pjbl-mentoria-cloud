import { Router, type Request } from 'express';
import type { ServicoRemoto } from '../../../shared/application/ServicoRemoto';
import { criarProxyHandler } from '../../../shared/http/proxy';

const id = (req: Request): string => encodeURIComponent(String(req.params.id ?? ''));

/** Slice `sessoes`: encaminha o contrato público de sessões ao serviço interno. */
export function sessoesRoutes(proxy: ServicoRemoto): Router {
  const router = Router();

  router.get(
    '/sessoes',
    criarProxyHandler(proxy, {
      metodo: 'GET',
      caminho: () => '/sessoes',
      usuarioIdNaQuery: true,
    }),
  );
  router.post('/sessoes', criarProxyHandler(proxy, { metodo: 'POST', caminho: () => '/sessoes' }));
  router.get(
    '/sessoes/:id',
    criarProxyHandler(proxy, { metodo: 'GET', caminho: (req) => `/sessoes/${id(req)}` }),
  );
  router.patch(
    '/sessoes/:id/status',
    criarProxyHandler(proxy, {
      metodo: 'PATCH',
      caminho: (req) => `/sessoes/${id(req)}/status`,
    }),
  );

  return router;
}
