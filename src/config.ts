import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().min(0).default(3000),
    API_KEY: z.string().min(1, 'API_KEY manquant'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL manquant'),
    DATABASE_PROVIDER: z.enum(['sqlite', 'postgresql']).default('sqlite'),
    IP_SALT: z.string().min(1, 'IP_SALT manquant'),
    CORS_ORIGIN: z.string().optional(),
    LOG_LEVEL: z.string().optional()
  })
  .transform((env) => ({
    ...env,
    corsOrigins: env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
      : ['http://localhost:5173'],
    logLevel: env.LOG_LEVEL ?? (env.NODE_ENV === 'production' ? 'info' : 'debug')
  }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuration invalide :', parsed.error.format());
  throw new Error('Impossible de démarrer sans configuration valide.');
}

export const config = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production'
};
