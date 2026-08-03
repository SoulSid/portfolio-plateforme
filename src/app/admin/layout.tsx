import Link from 'next/link';
import { auth } from '@/auth';
import { logout } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

/** Libellés d'interface : ils restent dans le code, c'est la seule exception du brief. */
const NAV = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/projets', label: 'Projets' },
  { href: '/admin/labs', label: 'Labs' },
  { href: '/admin/series', label: 'Séries' },
  { href: '/admin/tags', label: 'Tags' },
  { href: '/admin/skills', label: 'Compétences' },
  { href: '/admin/experiences', label: 'Expériences' },
  { href: '/admin/formations', label: 'Formations' },
  { href: '/admin/medias', label: 'Médias' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/parametres', label: 'Paramètres' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // La page de connexion utilise ce layout sans session : on la rend telle quelle.
  if (!session?.user) return <>{children}</>;

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="border-line bg-surface shrink-0 border-b md:w-56 md:border-r md:border-b-0">
        <div className="px-5 py-4">
          <p className="font-mono text-xs tracking-widest text-muted uppercase">Administration</p>
        </div>
        <nav aria-label="Navigation de l'administration" className="px-3 pb-4">
          <ul className="flex flex-wrap gap-1 md:flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:bg-bg block rounded-md px-3 py-2 text-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-line flex items-center justify-between gap-4 border-b px-5 py-3">
          <p className="truncate text-sm text-muted">
            Connecté en tant que <strong className="text-text">{session.user.name}</strong>
          </p>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Déconnexion
            </Button>
          </form>
        </header>

        <main className="min-w-0 flex-1 px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
