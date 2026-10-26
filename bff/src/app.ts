import express, { type Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import type { Config } from './shared/config';
import { HttpClient } from './shared/infrastructure/httpClient';
import { ServicoProxy } from './shared/infrastructure/servicoProxy';
import type { ServicoRemoto } from './shared/application/ServicoRemoto';
import type { AgregacaoDeps } from './features/agregacao/application/getAggregatedData';
import type { MentoresPort } from './features/agregacao/application/ports/MentoresPort';
import type { ReputacaoPort } from './features/agregacao/application/ports/ReputacaoPort';
import type { SessoesPort } from './features/agregacao/application/ports/SessoesPort';
import { MentoresHttpClient } from './features/agregacao/infrastructure/mentoresClient';
import { ReputacaoHttpClient } from './features/agregacao/infrastructure/reputacaoClient';
import { SessoesHttpClient } from './features/agregacao/infrastructure/sessoesClient';
import { agregacaoRoutes } from './features/agregacao/presentation/agregacaoRoutes';
import { eventosRoutes } from './features/eventos/presentation/eventosRoutes';
import { mentoresRoutes } from './features/mentores/presentation/mentoresRoutes';
import { saudeRoutes } from './features/saude/presentation/saudeRoutes';
import { sessoesRoutes } from './features/sessoes/presentation/sessoesRoutes';
import { errorHandler, rotaNaoEncontrada } from './shared/http/errorHandler';
import { openapiDocument } from './shared/http/openapi';

export interface AplicacaoDeps {
  config: Config;
  agregacao: AgregacaoDeps;
  proxyMentores: ServicoRemoto;
  proxySessoes: ServicoRemoto;
  proxyFuncao: ServicoRemoto;
}

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
    proxyFuncao: new ServicoProxy(httpFunction, 'reputacao'),
  };
}

export function criarApp(
  config: Config,
  deps: AplicacaoDeps = montarDependencias(config),
): Express {
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

  // Slices: cada um monta os próprios endpoints a partir de uma porta.
  app.use(agregacaoRoutes(deps.agregacao, config.HTTP_TIMEOUT_MS));
  app.use(mentoresRoutes(deps.proxyMentores));
  app.use(sessoesRoutes(deps.proxySessoes));
  app.use(eventosRoutes(deps.proxyFuncao));
  app.use(
    saudeRoutes(
      { mentores: deps.proxyMentores, sessoes: deps.proxySessoes, funcao: deps.proxyFuncao },
      config.HEALTH_TIMEOUT_MS,
    ),
  );

  app.use(rotaNaoEncontrada);
  app.use(errorHandler);

  return app;
}
