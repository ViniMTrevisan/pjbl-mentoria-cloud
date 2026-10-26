import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import type { SessaoRepository } from './features/sessoes/application/SessaoRepository';
import type { OutboxRepository } from './features/outbox/application/OutboxRepository';
import { sessoesRoutes } from './features/sessoes/presentation/sessoesRoutes';
import { errorHandler, notFoundHandler } from './shared/http/errorHandler';
import { saudeRoutes } from './shared/http/saudeRoutes';
import { openapi } from './shared/http/openapi';

export interface AppDeps {
  repo: SessaoRepository;
  outbox: OutboxRepository;
  corsOrigin: string;
}

/**
 * Composition root do serviço: monta o Express e injeta as portas dos slices.
 * O mesmo adaptador (SQL ou memória) implementa as portas de sessões e de outbox.
 */
export function createApp({ repo, corsOrigin }: AppDeps): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    cors({
      origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((item) => item.trim()),
    }),
  );
  app.use(express.json({ limit: '256kb' }));

  app.use(saudeRoutes('sessoes', 'sql', () => repo.verificarSaude()));

  app.get('/openapi.json', (_req, res) => {
    res.status(200).json(openapi);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.use('/sessoes', sessoesRoutes(repo));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
