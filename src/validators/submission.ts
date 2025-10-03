import { z } from 'zod';

export const submissionBodySchema = z.object({
  email: z
    .string({ invalid_type_error: 'Email invalide.' })
    .email('Email invalide.')
    .max(320, 'Email trop long.')
    .optional(),
  payload: z
    .record(z.any())
    .min(1, 'Le contenu ne peut pas être vide.'),
  consent: z
    .boolean({ invalid_type_error: 'Consentement manquant.' })
    .refine((value) => value === true, {
      message: 'Le consentement explicite est obligatoire.'
    })
});

export const submissionsQuerySchema = z
  .object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    email: z.string().email().optional(),
    cursor: z.string().optional(),
    limit: z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : 20))
      .pipe(z.number().int().min(1).max(100))
  })
  .refine(
    (value) => {
      if (value.from && value.to) {
        return new Date(value.from) <= new Date(value.to);
      }
      return true;
    },
    {
      message: 'Le paramètre "from" doit être antérieur ou égal à "to".',
      path: ['from']
    }
  );

export const submissionIdParamSchema = z.object({
  id: z.string().min(1)
});

export const submissionEmailParamSchema = z.object({
  email: z.string().email()
});
