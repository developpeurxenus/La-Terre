import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

export default async function globalSetup(): Promise<void> {
  const testDbPath = resolve(process.cwd(), 'prisma', 'test.db');

  if (existsSync(testDbPath)) {
    rmSync(testDbPath);
  }

  execSync('npx prisma migrate deploy --schema prisma/schema.prisma', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: 'file:./test.db',
      DATABASE_PROVIDER: 'sqlite'
    }
  });
}
