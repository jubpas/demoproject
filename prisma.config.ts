import 'dotenv/config';

import { defineConfig } from 'prisma/config';

const isGenerateCommand = process.argv.includes('generate');
const databaseUrl =
  process.env.DATABASE_URL ??
  (isGenerateCommand ? 'postgresql://prisma:prisma@localhost:5432/build' : undefined);

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Prisma commands other than prisma generate.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
