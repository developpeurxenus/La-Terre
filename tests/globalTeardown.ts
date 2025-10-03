import { PrismaClient } from '@prisma/client';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

export default async function globalTeardown(): Promise<void> {
  const prisma = new PrismaClient();
  await prisma.$disconnect();

  const testDbPath = resolve(process.cwd(), 'prisma', 'test.db');
  if (existsSync(testDbPath)) {
    rmSync(testDbPath);
  }
}
