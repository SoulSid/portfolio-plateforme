'use client';

import { useState, useTransition } from 'react';
import { reorderLabs } from '@/app/admin/series/actions';
import { Button } from '@/components/ui/button';

interface Lab {
  id: string;
  title: string;
  status: string;
}

/**
 * Réordonnancement des labs d'une série.
 *
 * Glisser-déposer natif, plus deux boutons monter/descendre : le clavier doit
 * pouvoir faire tout ce que la souris fait (plancher d'accessibilité, section 6).
 */
export function LabReorder({ seriesId, labs: initial }: { seriesId: string; labs: Lab[] }) {
  const [labs, setLabs] = useState(initial);
  const [dragged, setDragged] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const persist = (next: Lab[]) => {
    setLabs(next);
    startTransition(async () => {
      await reorderLabs(
        seriesId,
        next.map((l) => l.id),
      );
      setSavedAt(new Date().toLocaleTimeString('fr-FR'));
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= labs.length || from === to) return;
    const next = [...labs];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persist(next);
  };

  if (labs.length === 0) {
    return <p className="text-sm text-muted">Aucun lab rattaché à cette série.</p>;
  }

  return (
    <div>
      <ol className="space-y-2">
        {labs.map((lab, index) => (
          <li
            key={lab.id}
            draggable
            onDragStart={() => setDragged(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragged !== null) move(dragged, index);
              setDragged(null);
            }}
            onDragEnd={() => setDragged(null)}
            className="border-line flex items-center gap-3 rounded-lg border bg-white p-3"
          >
            <span className="font-mono text-xs text-muted" aria-hidden="true">
              ⠿
            </span>
            <span className="font-mono text-xs text-muted">Jour {index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm">{lab.title}</span>

            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Monter « ${lab.title} »`}
                disabled={index === 0 || pending}
                onClick={() => move(index, index - 1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Descendre « ${lab.title} »`}
                disabled={index === labs.length - 1 || pending}
                onClick={() => move(index, index + 1)}
              >
                ↓
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-3 font-mono text-xs text-muted" aria-live="polite">
        {pending ? 'Enregistrement de l’ordre…' : savedAt ? `Ordre enregistré ${savedAt}` : ''}
      </p>
    </div>
  );
}
