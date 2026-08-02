import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * Client Prisma en singleton.
 *
 * Prisma 7 exige un adaptateur de pilote. `adapter-pg` parle le protocole
 * PostgreSQL standard : il fonctionne avec Neon comme avec n'importe quelle
 * autre instance Postgres, ce qui laisse la porte ouverte à une migration
 * (Supabase, VPS) sans toucher au code.
 *
 * En développement, Next.js recharge les modules à chaque modification : sans
 * ce cache global, chaque rechargement ouvrirait un nouveau pool de connexions.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL est absente. Copiez .env.example en .env.local et renseignez la chaîne de connexion Neon.',
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
