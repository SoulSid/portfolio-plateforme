'use client';

import { useRef, useState, useTransition } from 'react';
import { deleteMedia, uploadMedia } from '@/app/admin/medias/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface MediaItem {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
}

const humanSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(bytes / 1024)} Ko`;

export function MediaLibrary({ items, configured }: { items: MediaItem[]; configured: boolean }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = items.filter((m) => m.alt.toLowerCase().includes(query.toLowerCase()));

  const send = (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    startTransition(async () => {
      for (const file of Array.from(files)) {
        const data = new FormData();
        data.set('file', file);
        data.set('alt', file.name.replace(/\.[^.]+$/, ''));
        const result = await uploadMedia(data);
        if (result.error) {
          setError(result.error);
          break;
        }
      }
    });
  };

  return (
    <div>
      {!configured && (
        <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Cloudinary n&apos;est pas configuré : renseignez les trois clés dans{' '}
          <code className="font-mono text-xs">.env.local</code>, puis relancez le serveur.
        </p>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          send(e.dataTransfer.files);
        }}
        className="border-line rounded-lg border border-dashed p-6 text-center"
      >
        <p className="text-sm text-muted">
          Glissez des images ici, ou{' '}
          <button
            type="button"
            className="text-accent underline"
            onClick={() => inputRef.current?.click()}
          >
            choisissez des fichiers
          </button>
          .
        </p>
        <p className="mt-1 font-mono text-xs text-muted">JPEG, PNG, WebP, GIF, AVIF — 8 Mo max.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => send(e.target.files)}
        />
        {pending && <p className="mt-3 font-mono text-xs text-muted">Envoi en cours…</p>}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <div className="mt-6 max-w-xs">
        <Input
          type="search"
          placeholder="Rechercher par description…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un média"
        />
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          {items.length === 0 ? 'Aucun média envoyé pour l’instant.' : 'Aucun résultat.'}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((media) => (
            <li key={media.id} className="border-line overflow-hidden rounded-lg border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.url}
                alt={media.alt}
                width={media.width}
                height={media.height}
                className="aspect-video w-full bg-black/5 object-contain"
              />
              <div className="space-y-2 p-3">
                <p className="truncate text-sm">{media.alt}</p>
                <p className="font-mono text-xs text-muted">
                  {media.width}×{media.height} · {humanSize(media.bytes)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard.writeText(media.url);
                      setCopied(media.id);
                      setTimeout(() => setCopied(null), 1500);
                    }}
                  >
                    {copied === media.id ? 'Copié' : 'Copier l’URL'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm('Supprimer cette image définitivement ?')) return;
                      startTransition(async () => {
                        await deleteMedia(media.id);
                      });
                    }}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
