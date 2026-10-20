import express, { type Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import type { MentoresPort } from '../application/ports/MentoresPort';
import type { ReputacaoPort } from '../application/ports/ReputacaoPort';
import type { SessoesPort } from '../application/ports/SessoesPort';
import type { Config } from '../infrastructure/config';
import { HttpClient } from '../infrastructure/clients/httpClient';
import { MentoresHttpClient } from '../infrastructure/clients/mentoresClient';
import { ReputacaoHttpClient } from '../infrastructure/clients/reputacaoClient';
import { ServicoProxy } from '../infrastructure/clients/servicoProxy';
import { SessoesHttpClient } from '../infrastructure/clients/sessoesClient';
import { errorHandler, rotaNaoEncontrada } from './errorHandler';
import { openapiDocument } from './openapi';
import { criarRotas, type RotasDeps } from './routes';

export interface AplicacaoDeps extends RotasDeps {}

/** Composition root: única camada que conhece config + adaptadores concretos. */
export function montarDependencias(config: Config): AplicacaoDeps {
  const httpMentores = new HttpClient(config.MENTORES_URL, config.HTTP_TIMEOUT_MS, 'mentores');
  const httpSessoes = new HttpClient(config.SESSOES_URL, config.HTTP_TIMEOUT_MS, 'sessoes');
  const httpFunction = new HttpClient(config.FUNCTION_URL, config.HTTP_TIMEOUT_MS, 'reputacao');

  const mentores: MentoresPort = new MentoresHttpClient(httpMentores);
  const sessoes: SessoesPort = new SessoesHttpClient(httpSessoes);
  const reputacao: ReputacaoPort = new ReputacaoHttpClient(httpFunction);

  return {
    config,
    agregacao: { mentores, sessoes, reputacao },
    proxyMentores: new ServicoProxy(httpMentores, 'mentores'),
    proxySessoes: new ServicoProxy(httpSessoes, 'sessoes'),
    proxyFunction: new ServicoProxy(httpFunction, 'reputacao'),
  };
}

export function criarApp(config: Config, deps: AplicacaoDeps = montarDependencias(config)): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(
    cors({
      origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',').map((o) => o.trim()),
      allowedHeaders: ['Content-Type', 'X-Usuario-Id', 'X-Gateway'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/openapi.json', (_req, res) => {
    res.json(openapiDocument);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

  app.use(criarRotas(deps));
  app.use(rotaNaoEncontrada);
  app.use(errorHandler);

  return app;
}
