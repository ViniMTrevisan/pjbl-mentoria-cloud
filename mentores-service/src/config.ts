export interface AppConfig {
  port: number;
  corsOrigin: string;
  mongodbUri?: string;
  mongodbDb: string;
  seedOnStart: boolean;
}

function booleano(valor: string | undefined, padrao: boolean): boolean {
  if (valor === undefined || valor === '') return padrao;
  return valor.toLowerCase() === 'true';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const porta = Number(env.PORT ?? 4001);
  return {
    port: Number.isInteger(porta) && porta > 0 ? porta : 4001,
    corsOrigin: env.CORS_ORIGIN?.trim() || '*',
    mongodbUri: env.MONGODB_URI?.trim() || undefined,
    mongodbDb: env.MONGODB_DB?.trim() || 'pjbl_mentoria',
    seedOnStart: booleano(env.SEED_ON_START, true),
  };
}
