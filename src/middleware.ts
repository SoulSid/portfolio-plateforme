import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

/**
 * Protège /admin/*. Utilise la configuration Edge (sans Prisma) : la décision
 * repose uniquement sur la présence d'un jeton de session valide.
 */
export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  matcher: ['/admin/:path*'],
};
