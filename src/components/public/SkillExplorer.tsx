'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Compétences cliquables.
 *
 * Chaque compétence est un bouton ; un clic ouvre une carte qui la décrit
 * (catégorie, description). Le niveau 1-5 n'est pas affiché : il n'a pas
 * encore été réglé pour de vrai (toutes les compétences sont à 3 par défaut). Le texte vient de la base : ce composant
 * ne contient aucun contenu éditorial, seulement l'interaction.
 *
 * Les valeurs arrivent déjà dans la bonne langue (le serveur applique pick()),
 * le composant n'a donc pas à connaître la locale.
 */

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
}

export interface SkillExplorerLabels {
  close: string;
  noDescription: string;
  hint: string;
}

interface Props {
  skills: SkillItem[];
  labels: SkillExplorerLabels;
  /** true : regroupe les compétences sous leur catégorie (page Profil). */
  grouped?: boolean;
}

export function SkillExplorer({ skills, labels, grouped = false }: Props) {
  const [selected, setSelected] = useState<SkillItem | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Échap ferme la carte ; le focus revient au bouton qui l'a ouverte.
  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  useEffect(() => {
    if (!selected) triggerRef.current?.focus();
  }, [selected]);

  const open = (skill: SkillItem, button: HTMLButtonElement) => {
    triggerRef.current = button;
    setSelected(skill);
  };

  const chip = (skill: SkillItem) => {
    const active = selected?.id === skill.id;
    return (
      <li key={skill.id}>
        <button
          type="button"
          onClick={(event) => open(skill, event.currentTarget)}
          aria-haspopup="dialog"
          aria-expanded={active}
          className="mono-label cursor-pointer rounded px-2.5 py-1 transition-colors hover:text-[var(--s-text)]"
          style={{
            border: `1px solid ${active ? 'var(--s-accent)' : 'var(--s-line)'}`,
            color: active ? 'var(--s-accent)' : undefined,
          }}
        >
          {skill.name}
        </button>
      </li>
    );
  };

  const groups = new Map<string, SkillItem[]>();
  if (grouped) {
    for (const skill of skills) {
      groups.set(skill.category, [...(groups.get(skill.category) ?? []), skill]);
    }
  }

  return (
    <>
      <p className="mb-4 text-sm" style={{ color: 'var(--s-muted)' }}>
        {labels.hint}
      </p>

      {grouped ? (
        <dl className="grid gap-6 sm:grid-cols-2">
          {[...groups.entries()].map(([category, items]) => (
            <div key={category}>
              <dt className="mono-label mb-2">{category}</dt>
              <dd className="m-0">
                <ul className="flex flex-wrap gap-2">{items.map(chip)}</ul>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <ul className="flex flex-wrap gap-2">{skills.map(chip)}</ul>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgb(0 0 0 / 0.6)' }}
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="skill-card-title"
            className="panel w-full max-w-md p-6 shadow-2xl"
            style={{ borderColor: 'var(--s-accent)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="mono-label">{selected.category}</p>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setSelected(null)}
                aria-label={labels.close}
                className="mono-label -mt-1 cursor-pointer rounded px-2 py-1 hover:text-[var(--s-text)]"
                style={{ border: '1px solid var(--s-line)' }}
              >
                ✕
              </button>
            </div>

            <h3
              id="skill-card-title"
              className="font-display mt-2 text-2xl font-extrabold tracking-tight"
            >
              {selected.name}
            </h3>

            <p
              className="mt-4 text-[0.9375rem] leading-relaxed"
              style={{ color: selected.description ? 'var(--s-text)' : 'var(--s-muted)' }}
            >
              {selected.description ?? labels.noDescription}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
