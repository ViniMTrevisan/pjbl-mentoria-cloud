import { Router } from 'express';

/**
 * Health check compartilhado pelos serviços: a dependência é checada com um
 * orçamento curto e nunca derruba a resposta (a API segue no ar degradada).
 */
export function saudeRoutes(
  servico: string,
  dependencia: string,
  checar: () => Promise<boolean>,
): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    let estado = 'indisponivel';
    try {
      const limite = new Promise<boolean>((resolver) => {
        const timer = setTimeout(() => resolver(false), 1500);
        timer.unref();
      });
      if (await Promise.race([checar(), limite])) estado = 'ok';
    } catch {
      estado = 'indisponivel';
    }
    res.status(200).json({ status: 'ok', servico, dependencia: { [dependencia]: estado } });
  });

  return router;
}
