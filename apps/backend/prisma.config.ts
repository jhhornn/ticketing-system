import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig, env } from 'prisma/config';

// Load .env from root directory
config({ path: resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: './common/database/prisma/schema.prisma',
  migrations: {
    path: './common/database/prisma/migrations',
    seed: 'tsx ./common/database/seed/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
