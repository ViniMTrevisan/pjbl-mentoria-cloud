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
    connectionTimeout: 15_000,
    requestTimeout: 60_000,
  };
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/**
 * Azure SQL recusa o login quando o catálogo inicial não existe. Primeiro
 * tentamos abrir o banco alvo; só se ele não existir conectamos ao master para
 * criá-lo. Evita repetir `CREATE DATABASE` (operação lenta) em todo boot.
 */
export async function garantirBanco(config: SqlRepositoryConfig): Promise<void> {
  const alvo = mssqlConfig(config);
  try {
    const teste = await new sql.ConnectionPool({ ...alvo, connectionTimeout: 15_000 }).connect();
    await teste.close();
    return;
  } catch {
    // banco ainda não existe (ou login sem catálogo): cai no caminho de criação
  }

  if (!/^[A-Za-z0-9_]+$/.test(config.database)) {
    throw new Error(`Nome de banco invalido: ${config.database}`);
  }

  const master = await conectarComRetry(
    mssqlConfig({ ...config, database: 'master' }),
    5,
    2_000,
  );
  try {
    const existente = await master
      .request()
      .input('nome', sql.NVarChar(128), config.database)
      .query('SELECT database_id FROM sys.databases WHERE name = @nome');
    if (existente.recordset.length === 0) {
      await master.request().query(`CREATE DATABASE [${config.database}]`);
    }
  } finally {
    await master.close();
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
