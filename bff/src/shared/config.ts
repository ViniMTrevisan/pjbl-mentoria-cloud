import { z } from 'zod';

const urlHttp = z
  .string()
  .min(1)
  .refine((valor) => /^https?:\/\/[^\s]+$/.test(valor), 'deve ser uma URL http(s)');

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MENTORES_URL: urlHttp.default('http://mentores-service:4001'),
  SESSOES_URL: urlHttp.default('http://sessoes-service:4002'),
  FUNCTION_URL: urlHttp.default('http://azure-function:7071'),
  CORS_ORIGIN: z.string().default('*'),
  HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
  HEALTH_TIMEOUT_MS: z.coerce.number().int().positive().default(1000),
});

export type Config = z.infer<typeof esquema>;

/** Lê e valida o ambiente uma única vez; falha cedo se algo estiver inválido. */
export function carregarConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const resultado = esquema.safeParse(env);
  if (!resultado.success) {
    const detalhes = resultado.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuração inválida do BFF — ${detalhes}`);
  }
  return resultado.data;
}
