import { loadConfig } from './shared/config';
import { createApp } from './app';
import type { MentorRepository } from './features/mentores/application/MentorRepository';
import { InMemoryMentorRepository } from './features/mentores/infrastructure/InMemoryMentorRepository';
import { MongoMentorRepository } from './features/mentores/infrastructure/MongoMentorRepository';
import { clonarMentoresSeed } from './features/mentores/infrastructure/mentoresSeed';

async function prepararMongo(
  repo: MongoMentorRepository,
  seedOnStart: boolean,
): Promise<void> {
  try {
    await repo.inicializar();
    if (seedOnStart && (await repo.contar()) === 0) {
      const seed = clonarMentoresSeed();
      await repo.inserirVarios(seed);
      console.log(`[mentores] seed aplicado: ${seed.length} mentores`);
    }
  } catch (erro) {
    console.error(
      `[mentores] falha ao preparar MongoDB: ${(erro as Error).message}. A API segue no ar.`,
    );
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  let repo: MentorRepository;
  let mongo: MongoMentorRepository | null = null;

  if (config.mongodbUri) {
    mongo = new MongoMentorRepository({
      uri: config.mongodbUri,
      dbName: config.mongodbDb,
    });
    repo = mongo;
  } else {
    repo = new InMemoryMentorRepository();
    console.log('[mentores] MONGODB_URI ausente: usando repositorio em memoria');
  }

  if (mongo) await prepararMongo(mongo, config.seedOnStart);

  const app = createApp({ repo, corsOrigin: config.corsOrigin });
  const server = app.listen(config.port, () => {
    console.log(`[mentores] escutando na porta ${config.port}`);
  });

  const encerrar = (sinal: string): void => {
    console.log(`[mentores] encerrando (${sinal})`);
    server.close(() => {
      void (async () => {
        if (mongo) await mongo.fechar();
        process.exit(0);
      })();
    });
  };
  process.on('SIGTERM', () => encerrar('SIGTERM'));
  process.on('SIGINT', () => encerrar('SIGINT'));
}

void main();
