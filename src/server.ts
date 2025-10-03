import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { securityMiddleware } from './middlewares/security';
import { submissionsRouter } from './routes/submissions';
import { publicRouter } from './routes/public';

const app = express();

app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(...securityMiddleware());
app.use(express.static('public'));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/submissions', submissionsRouter);
app.use('/api/public', publicRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
