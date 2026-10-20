import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import type { OutboxRepository, SessaoRepository } from '../ports/SessaoRepository';
import { errorHandler, notFoundHandler } from './errorHandler';
import { sessoesRoutes } from './routes/sessoesRoutes';
import { openapi } from './openapi';

export interface AppDeps {
  repo: SessaoRepository;
  outbox: OutboxRepository;
  corsOrigin: string;
}

async function checarDependencia(repo: SessaoRepository): Promise<boolean> {
  const limite = new Promise<boolean>((resolver) => {
    const timer = setTimeout(() => resolver(false), 1500);
    timer.unref?.();
  });
  try {
    return await Promise.race([repo.verificarSaude(), limite]);
  } catch {
    return false;
  }
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
    const disponivel = await checarDependencia(repo);
    res.status(200).json({
      status: 'ok',
      servico: 'sessoes',
      dependencia: { sql: disponivel ? 'ok' : 'indisponivel' },
    });
  });

  app.get('/openapi.json', (_req, res) => {
    res.status(200).json(openapi);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.use('/sessoes', sessoesRoutes(repo));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
