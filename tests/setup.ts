process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./test.db';
process.env.DATABASE_PROVIDER = process.env.DATABASE_PROVIDER ?? 'sqlite';
process.env.API_KEY = process.env.API_KEY ?? 'test-api-key';
process.env.IP_SALT = process.env.IP_SALT ?? 'test-salt';
process.env.PORT = process.env.PORT ?? '3001';
process.env.CORS_ORIGIN = 'http://localhost:5173';
