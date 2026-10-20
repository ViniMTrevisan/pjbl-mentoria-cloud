import { loadConfig } from './config';
import { createApp } from './http/app';
import { relayOutbox } from './features/relayOutbox';
import { InMemorySessaoRepository } from './infrastructure/memory/InMemorySessaoRepository';
import { SqlSessaoRepository } from './infrastructure/sql/SqlSessaoRepository';
import { clonarSessoesSeed } from './infrastructure/seed/sessoesSeed';

const INTERVALO_RELAY_MS = 2_000;

async function prepararSql(
  repo: SqlSessaoRepository,
  seedOnStart: boolean,
): Promise<void> {
  try {
    await repo.inicializar();
    if (seedOnStart && (await repo.contar()) === 0) {
      const seed = clonarSessoesSeed();
      await repo.inserirVarios(seed);
      console.log(`[sessoes] seed aplicado: ${seed.length} sessoes`);
    }
  } catch (erro) {
    console.error(
      `[sessoes] falha ao preparar SQL: ${(erro as Error).message}. A API segue no ar.`,
    );
  }
}

async function main(): Promise<void> {
  const config = loadConfig();

  const repo = config.sql
    ? new SqlSessaoRepository(config.sql)
    : new InMemorySessaoRepository();
  const sqlRepo = repo instanceof SqlSessaoRepository ? repo : null;

  if (!config.sql) {
    console.log('[sessoes] SQL_SERVER ausente: usando repositorio em memoria');
  }

  if (sqlRepo) await prepararSql(sqlRepo, config.seedOnStart);

  const app = createApp({ repo, outbox: repo, corsOrigin: config.corsOrigin });
  const server = app.listen(config.port, () => {
    console.log(`[sessoes] escutando na porta ${config.port}`);
  });

  let relayRodando = false;
  let falhaLogada = false;
  let falhaPublicacaoLogada = false;
  const tick = async (): Promise<void> => {
    if (relayRodando) return;
    relayRodando = true;
    try {
      const resultado = await relayOutbox({
        outbox: repo,
        sinkUrl: config.eventSinkUrl,
        log: (mensagem) => {
          if (falhaPublicacaoLogada) return;
          console.warn(`[sessoes] outbox: ${mensagem}`);
          falhaPublicacaoLogada = true;
        },
      });
      if (resultado.publicados > 0) {
        console.log(`[sessoes] outbox: ${resultado.publicados} evento(s) publicado(s)`);
      }
      if (resultado.falhas === 0) falhaPublicacaoLogada = false;
      falhaLogada = false;
    } catch (erro) {
      if (!falhaLogada) {
        console.warn(
          `[sessoes] outbox indisponivel: ${(erro as Error).message}. Tentando de novo.`,
        );
        falhaLogada = true;
      }
    } finally {
      relayRodando = false;
    }
  };
  const timer = setInterval(() => void tick(), INTERVALO_RELAY_MS);
  timer.unref();

  const encerrar = (sinal: string): void => {
    console.log(`[sessoes] encerrando (${sinal})`);
    clearInterval(timer);
    server.close(() => {
      void (async () => {
        if (sqlRepo) await sqlRepo.fechar();
        process.exit(0);
      })();
    });
  };
  process.on('SIGTERM', () => encerrar('SIGTERM'));
  process.on('SIGINT', () => encerrar('SIGINT'));
}

void main();
