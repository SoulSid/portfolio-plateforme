import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

const { auth } = NextAuth(authConfig);

/**
 * Deux responsabilités.
 *
 * 1. Protéger /admin/*.
 *    ATTENTION : dès qu'on fournit son propre callback à `auth()`, le rappel
 *    `authorized` de la configuration n'est PLUS appliqué automatiquement.
 *    C'est ce fichier qui doit refuser l'accès. Toute modification ici doit
 *    être suivie du test « /admin sans session → 307 vers /admin/login ».
 *
 * 2. Router les locales.
 *    Le français n'est pas préfixé dans l'URL publique (`/labs`) alors que
 *    l'arborescence de fichiers l'est (`app/[locale]/labs`) : on réécrit en
 *    interne sans changer l'URL affichée.
 */
export default auth((request) => {
  const { pathname } = request.nextUrl;

  /* ── 1. Administration ───────────────────────────────────────────── */
  if (pathname.startsWith('/admin')) {
    const isLoggedIn = Boolean(request.auth?.user);
    const isOnLogin = pathname === '/admin/login';

    if (isOnLogin) {
      return isLoggedIn
        ? NextResponse.redirect(new URL('/admin', request.nextUrl))
        : NextResponse.next();
    }

    if (!isLoggedIn) {
      const login = new URL('/admin/login', request.nextUrl);
      login.searchParams.set('callbackUrl', request.nextUrl.href);
      return NextResponse.redirect(login);
    }

    return NextResponse.next();
  }

  /* ── 2. Routes techniques : ni locale, ni authentification ───────── */
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/og') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  /* ── 3. Locales ──────────────────────────────────────────────────── */
  if (pathname.startsWith('/en')) {
    const passthrough = NextResponse.next();
    passthrough.headers.set('x-locale', 'en');
    return passthrough;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/fr${pathname === '/' ? '' : pathname}`;
  const rewritten = NextResponse.rewrite(url);
  rewritten.headers.set('x-locale', 'fr');
  return rewritten;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
