import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { securityMiddleware } from '../src/middlewares/security';
import { submissionsRouter } from '../src/routes/submissions';
import { publicRouter } from '../src/routes/public';

export default async function appServer() {
  const app = express();
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(cookieParser());
  app.use(...securityMiddleware());
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/submissions', submissionsRouter);
  app.use('/api/public', publicRouter);
  return app;
}
