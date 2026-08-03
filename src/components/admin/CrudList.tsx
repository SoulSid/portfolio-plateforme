'use client';

import { useActionState, useState, useTransition, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export interface CrudField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'textarea';
  required?: boolean;
  hint?: string;
  width?: string;
  min?: number;
  max?: number;
}

export interface CrudRow {
  id: string;
  /** Ce qui s'affiche quand la ligne n'est pas en édition. */
  primary: string;
  secondary: string;
  values: Record<string, string>;
}

type SaveAction = (
  id: string | null,
  prev: { error: string | null },
  formData: FormData,
) => Promise<{ error: string | null }>;

function Row({
  fields,
  row,
  save,
  onDone,
}: {
  fields: CrudField[];
  row: CrudRow | null;
  save: SaveAction;
  onDone?: () => void;
}) {
  const bound = save.bind(null, row?.id ?? null);
  const [state, formAction, pending] = useActionState(bound, { error: null });

  return (
    <form
      action={async (data) => {
        await formAction(data);
        onDone?.();
      }}
      className="border-line grid gap-3 rounded-lg border p-3 sm:grid-cols-2"
    >
      {fields.map((field) => {
        const id = `${field.name}-${row?.id ?? 'new'}`;
        const common = {
          id,
          name: field.name,
          required: field.required,
          defaultValue: row?.values[field.name] ?? '',
          className:
            'border-line w-full rounded-md border bg-white px-3 py-2 text-sm disabled:opacity-50',
        };
        return (
          <div key={field.name} className={field.width === 'full' ? 'sm:col-span-2' : ''}>
            <label htmlFor={id} className="mb-1 block text-sm font-medium">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea {...common} rows={3} />
            ) : (
              <input {...common} type={field.type ?? 'text'} min={field.min} max={field.max} />
            )}
            {field.hint && <p className="mt-1 text-xs text-muted">{field.hint}</p>}
          </div>
        );
      })}

      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? '…' : row ? 'Mettre à jour' : 'Ajouter'}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Annuler
          </Button>
        )}
        {state.error && (
          <p role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}

/**
 * Liste éditable générique : une ligne d'ajout, puis chaque entrée modifiable
 * sur place. Sert aux compétences, expériences et formations — même logique,
 * seuls les champs changent.
 */
export function CrudList({
  fields,
  rows,
  save,
  remove,
  addLabel,
  emptyLabel,
  extra,
}: {
  fields: CrudField[];
  rows: CrudRow[];
  save: SaveAction;
  remove: (id: string) => Promise<void>;
  addLabel: string;
  emptyLabel: string;
  extra?: ReactNode;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="max-w-3xl space-y-8">
      {extra}

      <section>
        <h2 className="mb-2 font-mono text-xs tracking-widest text-muted uppercase">{addLabel}</h2>
        <Row fields={fields} row={null} save={save} />
      </section>

      <section>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">{emptyLabel}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) =>
              editing === row.id ? (
                <li key={row.id}>
                  <Row fields={fields} row={row} save={save} onDone={() => setEditing(null)} />
                </li>
              ) : (
                <li
                  key={row.id}
                  className="border-line flex flex-wrap items-center gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.primary}</p>
                    <p className="truncate font-mono text-xs text-muted">{row.secondary}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditing(row.id)}>
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm(`Supprimer « ${row.primary} » ?`)) return;
                      startTransition(async () => {
                        await remove(row.id);
                      });
                    }}
                  >
                    Supprimer
                  </Button>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
