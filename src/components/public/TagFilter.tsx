'use client';

import { useState } from 'react';

/**
 * Filtre par tag, côté client et progressif : sans JavaScript, tout reste
 * visible. Le filtrage masque des éléments déjà rendus par le serveur.
 */
export function TagFilter({
  tags,
  allLabel,
  groupLabel,
  emptyLabel,
}: {
  tags: { slug: string; name: string }[];
  allLabel: string;
  groupLabel: string;
  emptyLabel: string;
}) {
  const [active, setActive] = useState('');

  const apply = (slug: string) => {
    setActive(slug);
    const items = document.querySelectorAll<HTMLElement>('[data-tags]');
    let visible = 0;
    items.forEach((item) => {
      const match = slug === '' || (item.dataset.tags ?? '').split(',').includes(slug);
      item.hidden = !match;
      if (match) visible += 1;
    });
    const empty = document.querySelector<HTMLElement>('[data-empty]');
    if (empty) empty.hidden = visible > 0;
  };

  const chip = (slug: string, label: string) => {
    const on = active === slug;
    return (
      <button
        key={slug || 'all'}
        type="button"
        onClick={() => apply(slug)}
        aria-pressed={on}
        className="mono-label rounded-full px-3 py-1 transition-colors"
        style={
          on
            ? { background: 'var(--s-accent)', color: 'var(--s-accent-ink)' }
            : { border: '1px solid var(--s-line)' }
        }
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div role="group" aria-label={groupLabel} className="flex flex-wrap gap-2">
        {chip('', allLabel)}
        {tags.map((tag) => chip(tag.slug, tag.name))}
      </div>
      <p data-empty hidden className="mono-label mt-6">
        {emptyLabel}
      </p>
    </>
  );
}
