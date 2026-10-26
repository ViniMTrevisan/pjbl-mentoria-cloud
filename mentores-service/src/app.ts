import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import type { MentorRepository } from './features/mentores/application/MentorRepository';
import { mentoresRoutes } from './features/mentores/presentation/mentoresRoutes';
import { avaliacoesRoutes } from './features/avaliacoes/presentation/avaliacoesRoutes';
import { errorHandler, notFoundHandler } from './shared/http/errorHandler';
import { saudeRoutes } from './shared/http/saudeRoutes';
import { openapi } from './shared/http/openapi';

export interface AppDeps {
  repo: MentorRepository;
  corsOrigin: string;
}

/**
 * Composition root do serviço: monta o Express e injeta os adaptadores nos
 * slices. Nenhum slice conhece outro slice além das próprias portas.
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

  app.use(saudeRoutes('mentores', 'banco', () => repo.verificarSaude()));

  app.get('/openapi.json', (_req, res) => {
    res.status(200).json(openapi);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.use('/mentores', mentoresRoutes(repo));
  app.use('/mentores', avaliacoesRoutes(repo));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
