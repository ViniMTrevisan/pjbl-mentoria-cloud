import { loadConfig } from '../src/shared/config';
import { SqlSessaoRepository } from '../src/features/sessoes/infrastructure/SqlSessaoRepository';
import { clonarSessoesSeed } from '../src/features/sessoes/infrastructure/sessoesSeed';

/** Seed idempotente: insere apenas sessoes cujo id ainda nao existe. */
async function main(): Promise<void> {
  const config = loadConfig();
  if (!config.sql) {
    console.error('SQL_SERVER obrigatorio para rodar o seed de sessoes.');
    process.exitCode = 1;
    return;
  }

  const repo = new SqlSessaoRepository(config.sql);
  try {
    await repo.inicializar();
    let inseridos = 0;
    for (const sessao of clonarSessoesSeed()) {
      if (await repo.buscarPorId(sessao.id)) continue;
      await repo.inserirVarios([sessao]);
      inseridos += 1;
    }
    console.log(`[seed] ${inseridos} sessao(oes) inseridas em ${config.sql.database}.SESSAO`);
  } finally {
    await repo.fechar();
  }
}

void main().catch((erro: unknown) => {
  console.error(`[seed] falhou: ${(erro as Error).message}`);
  process.exitCode = 1;
});
