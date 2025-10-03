import type { RequestHandler } from 'express';
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { submissionsLimiter } from '../middleware/rateLimiter.js';
import { requireApiKey } from '../middleware/apiKey.js';
import { hashIp } from '../utils/hash.js';
import { sanitizePayload, sanitizeString } from '../utils/sanitize.js';
import {
  submissionBodySchema,
  submissionsQuerySchema,
  submissionEmailParamSchema,
  submissionIdParamSchema
} from '../validators/submission.js';
import { config } from '../config.js';

function extractClientIp(req: Parameters<RequestHandler>[0]): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim();
  }

  return req.ip;
}

interface CreateRouterOptions {
  csrfProtection: RequestHandler;
}

export function createSubmissionsRouter({ csrfProtection }: CreateRouterOptions): Router {
  const router = Router();

  router.post('/', submissionsLimiter, csrfProtection, async (req, res, next) => {
    try {
      const body = submissionBodySchema.parse(req.body);
      const sanitizedPayload = sanitizePayload(body.payload) as Prisma.JsonValue;
      const sanitizedEmail = body.email ? sanitizeString(body.email) : undefined;
      const clientIp = extractClientIp(req);
      const ipHash = hashIp(clientIp, config.IP_SALT);
      const userAgent = req.get('user-agent')?.slice(0, 255) ?? undefined;

      const created = await prisma.submission.create({
        data: {
          email: sanitizedEmail,
          payload: sanitizedPayload,
          consent: body.consent,
          ipHash: ipHash ?? undefined,
          userAgent
        }
      });

      res.status(201).json({ id: created.id });
    } catch (error) {
      next(error);
    }
  });

  router.get('/', requireApiKey, async (req, res, next) => {
    try {
      const { cursor, limit, from, to, email } = submissionsQuerySchema.parse(req.query);

      const where: Parameters<typeof prisma.submission.findMany>[0]['where'] = {};

      if (from || to) {
        where.createdAt = {};
        if (from) {
          where.createdAt.gte = new Date(from);
        }
        if (to) {
          where.createdAt.lte = new Date(to);
        }
      }

      if (email) {
        where.email = email;
      }

      const take = limit + 1;

      const submissions = await prisma.submission.findMany({
        take,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        where
      });

      const hasNext = submissions.length === take;
      const data = hasNext ? submissions.slice(0, limit) : submissions;
      const nextCursor = hasNext ? data[data.length - 1]?.id ?? null : null;

      res.json({
        data,
        pagination: {
          hasNext,
          nextCursor
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', requireApiKey, csrfProtection, async (req, res, next) => {
    try {
      const params = submissionIdParamSchema.parse(req.params);

      await prisma.submission.delete({
        where: {
          id: params.id
        }
      });

      res.status(204).send();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ error: 'Soumission introuvable.' });
        return;
      }
      next(error);
    }
  });

  router.delete('/by-email/:email', requireApiKey, csrfProtection, async (req, res, next) => {
    try {
      const params = submissionEmailParamSchema.parse({ email: req.params.email });

      const result = await prisma.submission.deleteMany({
        where: {
          email: params.email
        }
      });

      res.status(200).json({ deleted: result.count });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
