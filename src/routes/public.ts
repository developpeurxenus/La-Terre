import { Router } from 'express';
import { prisma } from '../prisma';

export const publicRouter = Router();

// GET /api/public/submissions — liste publique (nom + date)
publicRouter.get('/submissions', async (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10) || 20, 100);
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

  const items = await prisma.submission.findMany({
    where: { publicConsent: true },
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  res.json({ data, nextCursor });
});
