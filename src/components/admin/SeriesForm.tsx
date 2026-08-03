'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { slugify } from '@/lib/slug';
import { saveSeries, type FormState } from '@/app/admin/series/actions';

export interface SeriesFormValues {
  id: string | null;
  title: string;
  slug: string;
  description: string;
  status: string;
}

const INITIAL: FormState = { error: null };

export function SeriesForm({ values }: { values: SeriesFormValues }) {
  const save = saveSeries.bind(null, values.id);
  const [state, formAction, pending] = useActionState(save, INITIAL);

  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.slug));

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {values.id ? 'Modifier la série' : 'Nouvelle série'}
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/series" className="text-sm text-muted hover:text-text">
            Retour
          </Link>
          <Button type="submit" disabled={pending}>
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="mt-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Titre</Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <p className="text-xs text-muted">
            Par exemple : « 20 jours — Pipeline de détection de fraude CDR ».
          </p>
          {err('title') && <p className="text-xs text-red-700">{err('title')}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="font-mono text-xs"
          />
          {err('slug') && <p className="text-xs text-red-700">{err('slug')}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={values.description} required />
          {err('description') && <p className="text-xs text-red-700">{err('description')}</p>}
        </div>

        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="status">Statut</Label>
          <Select id="status" name="status" defaultValue={values.status}>
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
            <option value="ARCHIVED">Archivé</option>
          </Select>
        </div>
      </div>
    </form>
  );
}
