import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error?.message === 'Origine non autorisée.') {
    res.status(403).json({ error: 'Origine interdite.' });
    return;
  }

  if (error?.code === 'EBADCSRFTOKEN') {
    res.status(403).json({ error: 'Token CSRF invalide ou manquant.' });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Requête invalide.',
      details: error.errors
    });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: 'JSON mal formé.' });
    return;
  }

  logger.error({ err: error, path: req.path }, 'Erreur interne');
  res.status(500).json({ error: 'Erreur interne du serveur.' });
};
