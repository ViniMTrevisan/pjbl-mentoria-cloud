import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import type { MentorRepository } from '../ports/MentorRepository';
import { errorHandler, notFoundHandler } from './errorHandler';
import { mentoresRoutes } from './routes/mentoresRoutes';
import { openapi } from './openapi';

export interface AppDeps {
  repo: MentorRepository;
  corsOrigin: string;
}

export function createApp({ repo, corsOrigin }: AppDeps): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    cors({
      origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((item) => item.trim()),
    }),
  );
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', async (_req, res) => {
    let banco = 'indisponivel';
    try {
      const limite = new Promise<boolean>((resolver) => {
        const timer = setTimeout(() => resolver(false), 1500);
        timer.unref();
      });
      if (await Promise.race([repo.verificarSaude(), limite])) banco = 'ok';
    } catch {
      banco = 'indisponivel';
    }
    res.status(200).json({ status: 'ok', servico: 'mentores', dependencia: { banco } });
  });

  app.get('/openapi.json', (_req, res) => {
    res.status(200).json(openapi);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.use('/mentores', mentoresRoutes(repo));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
