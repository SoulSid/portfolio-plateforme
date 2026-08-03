import type { NextAuthConfig } from 'next-auth';

/**
 * Configuration compatible Edge — c'est ELLE que le middleware charge.
 *
 * Elle ne doit contenir ni Prisma ni accès base : le middleware Next.js tourne
 * sur le runtime Edge, où le client Prisma n'est pas disponible. Le provider
 * Credentials, qui a besoin de la base, est ajouté dans src/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    /** Décide, avant même le rendu, si la requête a le droit de continuer. */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isOnLogin = nextUrl.pathname === '/admin/login';
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');

      // Déjà connecté sur la page de connexion : on renvoie au tableau de bord.
      if (isOnLogin) {
        return isLoggedIn ? Response.redirect(new URL('/admin', nextUrl)) : true;
      }

      // Tout le reste de /admin exige une session ; sinon Auth.js redirige vers signIn.
      if (isOnAdmin) return isLoggedIn;

      return true;
    },

    /** L'identifiant de l'utilisateur est porté par le jeton, pas par la base. */
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },

    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  providers: [], // complétés dans src/auth.ts
} satisfies NextAuthConfig;
