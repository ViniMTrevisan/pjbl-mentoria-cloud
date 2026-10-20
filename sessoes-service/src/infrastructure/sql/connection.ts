import sql from 'mssql';
import type { SqlRepositoryConfig } from './schema';

export function mssqlConfig(config: SqlRepositoryConfig): sql.config {
  return {
    server: config.server,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
    connectionTimeout: 5_000,
    requestTimeout: 10_000,
  };
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/**
 * O login falha se o catálogo inicial ainda não existe, então conectamos ao
 * master e criamos o banco antes de abrir o pool da aplicação.
 */
export async function garantirBanco(config: SqlRepositoryConfig): Promise<void> {
  if (!/^[A-Za-z0-9_]+$/.test(config.database)) {
    throw new Error(`Nome de banco invalido: ${config.database}`);
  }
  const pool = await conectarComRetry(
    mssqlConfig({ ...config, database: 'master' }),
    10,
    2_000,
  );
  try {
    await pool
      .request()
      .query(`IF DB_ID(N'${config.database}') IS NULL CREATE DATABASE [${config.database}]`);
  } finally {
    await pool.close();
  }
}

/** Tenta conectar varias vezes para aguentar o container do banco subindo. */
export async function conectarComRetry(
  config: sql.config,
  tentativas = 10,
  esperaMs = 2_000,
): Promise<sql.ConnectionPool> {
  let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      return await new sql.ConnectionPool(config).connect();
    } catch (erro) {
      ultimoErro = erro;
      console.warn(
        `[sessoes] SQL indisponivel (tentativa ${tentativa}/${tentativas}): ${(erro as Error).message}`,
      );
      if (tentativa < tentativas) await esperar(esperaMs);
    }
  }
  throw ultimoErro;
}
