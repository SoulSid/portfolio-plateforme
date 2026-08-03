'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INITIAL: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, INITIAL);

  return (
    <main className="grid min-h-svh place-items-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">Administration</p>
        <h1 className="font-display mt-1 mb-6 text-2xl font-bold tracking-tight">Connexion</h1>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-red-700">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </main>
  );
}
