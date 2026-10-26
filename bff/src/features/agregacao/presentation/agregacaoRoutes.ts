import { Router } from 'express';
import { getAggregatedData, type AgregacaoDeps } from '../application/getAggregatedData';
import { resolverUsuarioId } from '../../../shared/http/usuario';

/** Slice `agregacao`: view model da tela inicial montado a partir dos serviços. */
export function agregacaoRoutes(agregacao: AgregacaoDeps, timeoutMs: number): Router {
  const router = Router();

  router.get('/aggregated-data', async (req, res, next) => {
    try {
      const usuarioId = resolverUsuarioId(req);
      const dados = await getAggregatedData(agregacao, { usuarioId, timeoutMs });
      res.status(200).json(dados);
    } catch (erro) {
      next(erro);
    }
  });

  return router;
}
