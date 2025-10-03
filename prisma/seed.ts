import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.submission.create({
    data: {
      email: 'demo@example.com',
      payload: { message: 'Bonjour Terre', fields: ['nom', 'email'] },
      consent: true,
      ipHash: 'seed-hash',
      userAgent: 'seed-script'
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
