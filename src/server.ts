import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import pinoHttp from 'pino-http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createSubmissionsRouter } from './routes/submissions.js';
import { healthRouter } from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', 1);

app.use(
  pinoHttp({
    logger,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie'],
      remove: true
    }
  })
);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origine non autorisée.'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const csrfProtection = csurf({
  cookie: {
    key: 'csrf_token',
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction
  },
  value: (req) => {
    const header = req.headers['x-csrf-token'];
    if (Array.isArray(header)) {
      return header[0];
    }
    return header ?? '';
  }
});

app.get('/csrf', csrfProtection, (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

app.use('/health', healthRouter);
app.use('/api/submissions', createSubmissionsRouter({ csrfProtection }));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(errorHandler);

const port = config.PORT;

if (process.env.JEST_WORKER_ID === undefined) {
  app.listen(port, () => {
    logger.info({ port }, 'Serveur démarré');
  });
}

export default app;
