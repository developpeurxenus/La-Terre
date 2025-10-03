import request from 'supertest';
import { prisma } from '../../src/lib/prisma.js';
import app from '../../src/server.js';

const API_KEY = process.env.API_KEY ?? 'test-api-key';

describe('Submissions API', () => {
  const agent = request.agent(app);

  beforeEach(async () => {
    await prisma.submission.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function getCsrfToken() {
    const response = await agent.get('/csrf');
    expect(response.status).toBe(200);
    const token = response.body?.csrfToken;
    expect(typeof token).toBe('string');
    return token as string;
  }

  it('crée une soumission valide', async () => {
    const csrfToken = await getCsrfToken();

    const response = await agent
      .post('/api/submissions')
      .set('x-csrf-token', csrfToken)
      .send({
        email: 'contact@example.com',
        payload: { message: 'Hello', origin: 'test' },
        consent: true
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');

    const stored = await prisma.submission.findUnique({ where: { id: response.body.id } });
    expect(stored).not.toBeNull();
    expect(stored?.email).toBe('contact@example.com');
  });

  it('refuse une soumission sans consentement', async () => {
    const csrfToken = await getCsrfToken();

    const response = await agent
      .post('/api/submissions')
      .set('x-csrf-token', csrfToken)
      .send({
        email: 'contact@example.com',
        payload: { message: 'Hello' },
        consent: false
      });

    expect(response.status).toBe(400);
  });

  it('protège la liste par clé API et gère la pagination', async () => {
    const csrfToken = await getCsrfToken();

    await Promise.all(
      Array.from({ length: 3 }).map((_, index) =>
        agent
          .post('/api/submissions')
          .set('x-csrf-token', csrfToken)
          .send({
            email: `user${index}@example.com`,
            payload: { index },
            consent: true
          })
      )
    );

    const unauthorized = await agent.get('/api/submissions');
    expect(unauthorized.status).toBe(401);

    const listResponse = await agent
      .get('/api/submissions')
      .set('x-api-key', API_KEY)
      .query({ limit: '2' });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(2);
    if (listResponse.body.pagination.hasNext) {
      const nextResponse = await agent
        .get('/api/submissions')
        .set('x-api-key', API_KEY)
        .query({ cursor: listResponse.body.pagination.nextCursor, limit: '2' });

      expect(nextResponse.status).toBe(200);
    }
  });

  it('supprime une soumission par ID', async () => {
    const csrfToken = await getCsrfToken();

    const creation = await agent
      .post('/api/submissions')
      .set('x-csrf-token', csrfToken)
      .send({
        email: 'delete@example.com',
        payload: { message: 'Bye' },
        consent: true
      });

    const submissionId = creation.body.id;

    const deletion = await agent
      .delete(`/api/submissions/${submissionId}`)
      .set('x-api-key', API_KEY)
      .set('x-csrf-token', csrfToken);

    expect(deletion.status).toBe(204);

    const missing = await agent
      .delete(`/api/submissions/${submissionId}`)
      .set('x-api-key', API_KEY)
      .set('x-csrf-token', csrfToken);

    expect(missing.status).toBe(404);
  });
});
