import request from 'supertest';
import { prisma } from '../src/prisma';
import appServer from '../tests/serverHelper';

describe('API', () => {
  afterAll(async () => { await prisma.$disconnect(); });

  it('health', async () => {
    const app = await appServer();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
