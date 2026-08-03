import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { loginSchema } from '@/lib/validations/auth';

/**
 * Hachage bcrypt d'une chaîne quelconque, utilisé comme leurre.
 * Quand l'e-mail n'existe pas, on compare quand même contre ce hachage : sans
 * cela, la réponse serait mesurablement plus rapide et permettrait d'énumérer
 * les comptes existants.
 */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO1ZQ8Zv1kZ1KzQY2Nn8kZ7Xq5Vv0aB1u';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !matches) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
