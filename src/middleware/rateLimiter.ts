import rateLimit from 'express-rate-limit';

export const submissionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'global',
  handler: (_req, res) => {
    res.status(429).json({ error: 'Trop de tentatives, merci de réessayer plus tard.' });
  }
});
