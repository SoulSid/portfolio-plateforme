import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { deleteMessage, toggleRead } from './actions';

export const metadata = { title: 'Messages — Administration' };
export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  const unread = messages.filter((m) => !m.read).length;

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight">Messages</h1>
      <p className="mt-2 mb-6 text-sm text-muted">
        {messages.length} message{messages.length > 1 ? 's' : ''} · {unread} non lu
        {unread > 1 ? 's' : ''}
      </p>

      {messages.length === 0 ? (
        <p className="text-sm text-muted">Aucun message reçu.</p>
      ) : (
        <ul className="max-w-3xl space-y-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className="border-line rounded-lg border p-4"
              style={message.read ? undefined : { borderColor: 'var(--color-cobalt)' }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {message.name}{' '}
                  <a
                    href={`mailto:${message.email}`}
                    className="text-accent font-normal hover:underline"
                  >
                    &lt;{message.email}&gt;
                  </a>
                </p>
                <p className="font-mono text-xs text-muted">
                  {message.createdAt.toISOString().slice(0, 16).replace('T', ' ')}
                </p>
              </div>

              {message.subject && <p className="mt-1 text-sm font-medium">{message.subject}</p>}
              <p className="mt-2 text-sm whitespace-pre-line">{message.body}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <form
                  action={async () => {
                    'use server';
                    await toggleRead(message.id);
                  }}
                >
                  <Button type="submit" variant="outline" size="sm">
                    {message.read ? 'Marquer non lu' : 'Marquer lu'}
                  </Button>
                </form>
                <form
                  action={async () => {
                    'use server';
                    await deleteMessage(message.id);
                  }}
                >
                  <Button type="submit" variant="ghost" size="sm">
                    Supprimer
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
