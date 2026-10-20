import type { SqlRepositoryConfig } from './infrastructure/sql/schema';

export interface AppConfig {
  port: number;
  corsOrigin: string;
  eventSinkUrl: string;
  seedOnStart: boolean;
  sql?: SqlRepositoryConfig;
}

function booleano(valor: string | undefined, padrao: boolean): boolean {
  if (valor === undefined || valor === '') return padrao;
  return valor.toLowerCase() === 'true';
}

function numero(valor: string | undefined, padrao: number): number {
  const convertido = Number(valor ?? padrao);
  return Number.isInteger(convertido) && convertido > 0 ? convertido : padrao;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const servidor = env.SQL_SERVER?.trim();
  let sql: SqlRepositoryConfig | undefined;

  if (servidor) {
    const senha = env.SQL_PASSWORD ?? '';
    if (!senha) {
      throw new Error('SQL_PASSWORD obrigatorio quando SQL_SERVER esta definido');
    }
    sql = {
      server: servidor,
      port: numero(env.SQL_PORT, 1433),
      database: env.SQL_DATABASE?.trim() || 'pjbl_mentoria',
      user: env.SQL_USER?.trim() || 'sa',
      password: senha,
      encrypt: booleano(env.SQL_ENCRYPT, false),
    };
  }

  return {
    port: numero(env.PORT, 4002),
    corsOrigin: env.CORS_ORIGIN?.trim() || '*',
    eventSinkUrl: env.EVENT_SINK_URL?.trim() || 'http://azure-function:7071',
    seedOnStart: booleano(env.SEED_ON_START, true),
    sql,
  };
}
