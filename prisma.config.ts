// Prisma 7 ne charge plus .env automatiquement : c'est ce fichier qui s'en charge.
// Aucune valeur secrète ici — tout vient de .env.local, jamais versionné.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Utilisé par `npx prisma db seed` à partir de la Phase 1.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
