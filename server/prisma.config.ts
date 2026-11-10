import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Configuration de la CLI Prisma.
 * La migration utilise la connexion directe Neon (sans pooler),
 * tandis que l'API utilise la connexion groupée définie dans .env.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      'postgresql://localhost:5432/rhouphouet',
  },
});
