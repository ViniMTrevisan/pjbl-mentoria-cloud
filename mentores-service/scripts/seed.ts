import { loadConfig } from '../src/config';
import { MongoMentorRepository } from '../src/infrastructure/mongo/MongoMentorRepository';
import { clonarMentoresSeed } from '../src/infrastructure/seed/mentoresSeed';

/** Seed idempotente: upsert por id (usa o mesmo conteudo do seed automatico). */
async function main(): Promise<void> {
  const config = loadConfig();
  if (!config.mongodbUri) {
    console.error('MONGODB_URI obrigatorio para rodar o seed.');
    process.exitCode = 1;
    return;
  }

  const repo = new MongoMentorRepository({
    uri: config.mongodbUri,
    dbName: config.mongodbDb,
  });

  try {
    await repo.inicializar();
    const seed = clonarMentoresSeed();
    let inseridos = 0;
    let atualizados = 0;
    for (const mentor of seed) {
      if (await repo.buscarPorId(mentor.id)) {
        await repo.atualizar(mentor);
        atualizados += 1;
      } else {
        await repo.criar(mentor);
        inseridos += 1;
      }
    }
    console.log(
      `[seed] ${inseridos} inseridos, ${atualizados} atualizados na base ${config.mongodbDb}.mentores`,
    );
  } finally {
    await repo.fechar();
  }
}

void main().catch((erro: unknown) => {
  console.error(`[seed] falhou: ${(erro as Error).message}`);
  process.exitCode = 1;
});
