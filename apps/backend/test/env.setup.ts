import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-use-only-in-tests-1234567890';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgresql://financi:financi@localhost:5439/financi_test?schema=public';
