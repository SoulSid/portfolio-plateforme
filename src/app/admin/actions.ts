'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/auth';

export type LoginState = { error: string | null };

/**
 * Connexion à l'espace d'administration.
 * Le message d'erreur reste volontairement générique : il ne dit jamais si
 * c'est l'e-mail ou le mot de passe qui est faux.
 */
export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/admin',
    });
    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Identifiants incorrects.' };
    }
    // signIn lève une redirection en cas de succès : elle doit remonter.
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: '/admin/login' });
}
