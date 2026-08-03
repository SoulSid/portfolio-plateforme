import { NextResponse, type NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

const { auth } = NextAuth(authConfig);

/**
 * Deux responsabilités :
 *
 * 1. Protéger /admin/* — délégué à Auth.js (configuration Edge, sans Prisma).
 * 2. Router les locales — le français n'est pas préfixé dans l'URL publique
 *    (`/labs`) mais l'arborescence de fichiers l'est (`app/[locale]/labs`).
 *    On réécrit donc en interne vers /fr/... sans changer l'URL affichée.
 */
export default auth((request: NextRequest) => {
  const { pathname } = request.nextUrl;

  /* Laisse passer l'admin, les API, les fichiers statiques. */
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/en') ||
    /\.[^/]+$/.test(pathname)
  ) {
    const passthrough = NextResponse.next();
    if (pathname.startsWith('/en')) passthrough.headers.set('x-locale', 'en');
    return passthrough;
  }

  /* Le francais n'est pas prefixe dans l'URL : on reecrit vers /fr en interne. */
  const url = request.nextUrl.clone();
  url.pathname = `/fr${pathname === '/' ? '' : pathname}`;
  const rewritten = NextResponse.rewrite(url);
  rewritten.headers.set('x-locale', 'fr');
  return rewritten;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
