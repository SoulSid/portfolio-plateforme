// Prisma 7 ne charge plus les variables d'environnement automatiquement.
// On pointe explicitement .env.local — le même fichier que Next.js lit — pour
// qu'il n'y ait qu'UNE seule source de configuration locale.
// Aucune valeur secrète ici : .env.local n'est jamais versionné.
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '.env.local' });

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
