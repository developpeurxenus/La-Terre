import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { submissionsLimiter } from '../middlewares/limiter';
import { csrfProtection } from '../middlewares/csrf';
import { sha256 } from '../utils/hash';

export const submissionsRouter = Router();

const submissionSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional(),
  payload: z.record(z.any()).refine(v => Object.keys(v || {}).length > 0, { message: 'payload requis' }),
  consent: z.literal(true),
  publicConsent: z.boolean().default(false)
});

// CSRF token helper (GET /csrf)
submissionsRouter.get('/csrf', csrfProtection, (req, res) => {
  res.json({ csrfToken: (req as any).csrfToken() });
});

// POST /api/submissions — crée une soumission
submissionsRouter.post('/', submissionsLimiter, csrfProtection, async (req, res) => {
  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { name, email, payload, consent, publicConsent } = parsed.data;

  const ipHeader = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string;
  const ip = ipHeader.split(',')[0]?.trim();
  const salt = process.env.IP_SALT || '';
  const ipHash = ip ? sha256(ip + salt) : null;
  const userAgent = req.headers['user-agent']?.toString();

  const created = await prisma.submission.create({
    data: { name, email, payload, consent, publicConsent, ipHash, userAgent },
    select: { id: true }
  });

  res.status(201).json({ id: created.id });
});

// GET /api/submissions — admin (x-api-key)
submissionsRouter.get('/', async (req, res) => {
  const apiKey = req.header('x-api-key');
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const email = typeof req.query.email === 'string' ? req.query.email : undefined;
  const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10) || 20, 100);
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

  const where: any = {};
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  if (email) where.email = email;

  const items = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  res.json({ data, nextCursor });
});

// DELETE /api/submissions/:id — droit à l'effacement
submissionsRouter.delete('/:id', async (req, res) => {
  const apiKey = req.header('x-api-key');
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const id = req.params.id;
  await prisma.submission.delete({ where: { id } }).catch(() => null);
  res.json({ ok: true });
});
