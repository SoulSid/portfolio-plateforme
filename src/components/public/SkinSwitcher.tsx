'use client';

import { useEffect, useState } from 'react';

export type Skin = 'octet' | 'bitfield';

const SKINS: { id: Skin; code: string; label: string }[] = [
  { id: 'octet', code: '1A', label: 'OCTET' },
  { id: 'bitfield', code: '1B', label: 'BITFIELD' },
];

/**
 * Bascule entre les deux directions visuelles.
 * Le choix est écrit sur <html data-skin> et mémorisé ; un script inline dans
 * le layout l'applique avant le premier rendu pour éviter tout clignotement.
 */
export function SkinSwitcher({ label }: { label: string }) {
  const [skin, setSkin] = useState<Skin>('octet');

  useEffect(() => {
    const current = document.documentElement.dataset.skin;
    if (current === 'bitfield' || current === 'octet') setSkin(current);
  }, []);

  const choose = (next: Skin) => {
    setSkin(next);
    document.documentElement.dataset.skin = next;
    try {
      localStorage.setItem('skin', next);
    } catch {
      /* stockage indisponible : le choix vaut pour la page courante */
    }
  };

  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      {SKINS.map((item) => {
        const active = skin === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => choose(item.id)}
            aria-pressed={active}
            className="rounded px-2 py-1 font-mono text-[0.625rem] tracking-[0.14em] whitespace-nowrap transition-colors"
            style={
              active
                ? { background: 'var(--s-accent)', color: 'var(--s-accent-ink)' }
                : { color: 'var(--s-muted)', border: '1px solid var(--s-line)' }
            }
          >
            {item.code} · {item.label}
          </button>
        );
      })}
    </div>
  );
}
