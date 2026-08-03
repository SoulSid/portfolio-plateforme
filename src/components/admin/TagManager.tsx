'use client';

import { useActionState, useState, useTransition } from 'react';
import { deleteTag, saveTag, type FormState } from '@/app/admin/tags/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

export interface TagRow {
  id: string;
  name: string;
  slug: string;
  kind: string;
  color: string | null;
  usage: number;
}

const INITIAL: FormState = { error: null };

const KIND_LABEL: Record<string, string> = { TECH: 'Technique', DOMAIN: 'Domaine' };

function TagForm({ row, onDone }: { row: TagRow | null; onDone?: () => void }) {
  const save = saveTag.bind(null, row?.id ?? null);
  const [state, formAction, pending] = useActionState(save, INITIAL);

  return (
    <form
      action={async (data) => {
        await formAction(data);
        onDone?.();
      }}
      className="border-line flex flex-wrap items-end gap-3 rounded-lg border p-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor={`name-${row?.id ?? 'new'}`}>Nom</Label>
        <Input
          id={`name-${row?.id ?? 'new'}`}
          name="name"
          defaultValue={row?.name ?? ''}
          required
          className="w-44"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`slug-${row?.id ?? 'new'}`}>Slug</Label>
        <Input
          id={`slug-${row?.id ?? 'new'}`}
          name="slug"
          defaultValue={row?.slug ?? ''}
          placeholder="auto"
          className="w-44 font-mono text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`kind-${row?.id ?? 'new'}`}>Type</Label>
        <Select
          id={`kind-${row?.id ?? 'new'}`}
          name="kind"
          defaultValue={row?.kind ?? 'TECH'}
          className="w-36"
        >
          <option value="TECH">Technique</option>
          <option value="DOMAIN">Domaine</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`color-${row?.id ?? 'new'}`}>Couleur</Label>
        <Input
          id={`color-${row?.id ?? 'new'}`}
          name="color"
          defaultValue={row?.color ?? ''}
          placeholder="#1F3FBF"
          className="w-28 font-mono text-xs"
        />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? '…' : row ? 'Mettre à jour' : 'Ajouter'}
      </Button>

      {state.error && (
        <p role="alert" className="w-full text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function TagManager({ rows }: { rows: TagRow[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const grouped = {
    TECH: rows.filter((r) => r.kind === 'TECH'),
    DOMAIN: rows.filter((r) => r.kind === 'DOMAIN'),
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 font-mono text-xs tracking-widest text-muted uppercase">
          Nouveau tag
        </h2>
        <TagForm row={null} />
      </section>

      {(['TECH', 'DOMAIN'] as const).map((kind) => (
        <section key={kind}>
          <h2 className="mb-2 font-mono text-xs tracking-widest text-muted uppercase">
            {KIND_LABEL[kind]} · {grouped[kind].length}
          </h2>
          <ul className="space-y-2">
            {grouped[kind].map((row) =>
              editing === row.id ? (
                <li key={row.id}>
                  <TagForm row={row} onDone={() => setEditing(null)} />
                </li>
              ) : (
                <li
                  key={row.id}
                  className="border-line flex flex-wrap items-center gap-3 rounded-lg border p-3"
                >
                  {row.color && (
                    <span
                      aria-hidden="true"
                      className="size-3 rounded-full"
                      style={{ background: row.color }}
                    />
                  )}
                  <span className="flex-1 text-sm">{row.name}</span>
                  <span className="font-mono text-xs text-muted">
                    /{row.slug} · {row.usage} contenu{row.usage > 1 ? 's' : ''}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setEditing(row.id)}>
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      const msg =
                        row.usage > 0
                          ? `Supprimer « ${row.name} » ? Il sera retiré de ${row.usage} contenu(s), qui ne seront pas supprimés.`
                          : `Supprimer « ${row.name} » ?`;
                      if (!window.confirm(msg)) return;
                      startTransition(async () => {
                        await deleteTag(row.id);
                      });
                    }}
                  >
                    Supprimer
                  </Button>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
