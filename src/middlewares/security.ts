import type { RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';

export function securityMiddleware() {
  const origins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const useCors = cors({
    origin: origins.length ? origins : true,
    credentials: true
  });
  const useHelmet = helmet();
  return [useHelmet, useCors] as RequestHandler[];
}
