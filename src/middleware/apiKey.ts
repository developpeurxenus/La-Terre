import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header('x-api-key');

  if (!apiKey || apiKey !== config.API_KEY) {
    res.status(401).json({ error: 'Accès non autorisé.' });
    return;
  }

  next();
}
