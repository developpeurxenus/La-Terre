import { submissionBodySchema, submissionsQuerySchema } from '../../src/validators/submission.js';

describe('submissionBodySchema', () => {
  it('valide une requête correcte', () => {
    const data = {
      email: 'user@example.com',
      payload: { message: 'Salut' },
      consent: true
    };

    expect(() => submissionBodySchema.parse(data)).not.toThrow();
  });

  it('rejette un payload vide', () => {
    const data = {
      payload: {},
      consent: true
    };

    expect(() => submissionBodySchema.parse(data)).toThrow();
  });

  it('rejette l’absence de consentement', () => {
    const data = {
      payload: { ok: true },
      consent: false
    };

    expect(() => submissionBodySchema.parse(data)).toThrow('Le consentement explicite est obligatoire.');
  });

  it('rejette un email invalide', () => {
    const data = {
      email: 'not-an-email',
      payload: { ok: true },
      consent: true
    };

    expect(() => submissionBodySchema.parse(data)).toThrow();
  });
});

describe('submissionsQuerySchema', () => {
  it('applique la pagination par défaut', () => {
    const parsed = submissionsQuerySchema.parse({});
    expect(parsed.limit).toBe(20);
  });

  it('rejette une plage de dates incohérente', () => {
    expect(() =>
      submissionsQuerySchema.parse({
        from: '2024-01-02T00:00:00.000Z',
        to: '2024-01-01T00:00:00.000Z'
      })
    ).toThrow();
  });
});
