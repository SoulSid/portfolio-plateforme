'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Editor } from '@/components/editor/Editor';
import { uploadFromEditor } from '@/components/editor/uploadFromEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { slugify } from '@/lib/slug';
import { saveLab, type FormState } from '@/app/admin/labs/actions';

export interface LabFormValues {
  id: string | null;
  title: string;
  slug: string;
  objective: string;
  content: string;
  takeaway: string;
  seriesId: string;
  dayNumber: string;
  durationHours: string;
  difficulty: string;
  repoUrl: string;
  status: string;
  tagIds: string[];
}

interface Props {
  values: LabFormValues;
  allTags: { id: string; name: string; kind: string }[];
  allSeries: { id: string; title: string }[];
  previewUrl: string | null;
}

const INITIAL: FormState = { error: null };
const AUTOSAVE_MS = 20_000;

export function LabForm({ values, allTags, allSeries, previewUrl }: Props) {
  const save = saveLab.bind(null, values.id);
  const [state, formAction, pending] = useActionState(save, INITIAL);

  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.slug));
  const [content, setContent] = useState(values.content);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const markDirty = useCallback(() => setDirty(true), []);

  useEffect(() => {
    if (!values.id) return;
    const timer = setInterval(() => {
      if (!dirty || pending) return;
      formRef.current?.requestSubmit();
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString('fr-FR'));
    }, AUTOSAVE_MS);
    return () => clearInterval(timer);
  }, [dirty, pending, values.id]);

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form ref={formRef} action={formAction} onChange={markDirty} className="max-w-3xl">
      <input type="hidden" name="content" value={content} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {values.id ? 'Modifier le lab' : 'Nouveau lab'}
        </h1>
        <div className="flex items-center gap-3">
          {savedAt && <span className="font-mono text-xs text-muted">enregistré {savedAt}</span>}
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-accent text-sm hover:underline"
            >
              Aperçu
            </a>
          )}
          <Link href="/admin/labs" className="text-sm text-muted hover:text-text">
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
          <Label htmlFor="objective">Objectif</Label>
          <Textarea id="objective" name="objective" defaultValue={values.objective} required />
          <p className="text-xs text-muted">Ce que vous vouliez valider, en une ou deux phrases.</p>
          {err('objective') && <p className="text-xs text-red-700">{err('objective')}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Démarche, commandes, captures, résultat</Label>
          <Editor
            value={values.content}
            onChange={(html) => {
              setContent(html);
              markDirty();
            }}
            onUploadImage={uploadFromEditor}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="takeaway">Ce que j&apos;en retiens</Label>
          <Textarea id="takeaway" name="takeaway" defaultValue={values.takeaway} />
          <p className="text-xs text-muted">Encart affiché en fin de lab. Facultatif.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="seriesId">Série</Label>
            <Select id="seriesId" name="seriesId" defaultValue={values.seriesId}>
              <option value="">— Aucune (lab isolé) —</option>
              {allSeries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dayNumber">Jour dans la série</Label>
            <Input
              id="dayNumber"
              name="dayNumber"
              type="number"
              min={1}
              defaultValue={values.dayNumber}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="durationHours">Durée (heures)</Label>
            <Input
              id="durationHours"
              name="durationHours"
              type="number"
              step="0.5"
              min={0}
              defaultValue={values.durationHours}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="difficulty">Difficulté (1 à 5)</Label>
            <Input
              id="difficulty"
              name="difficulty"
              type="number"
              min={1}
              max={5}
              defaultValue={values.difficulty}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="repoUrl">Dépôt</Label>
            <Input id="repoUrl" name="repoUrl" type="url" defaultValue={values.repoUrl} />
            {err('repoUrl') && <p className="text-xs text-red-700">{err('repoUrl')}</p>}
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Tags</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {allTags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="tagIds"
                  value={tag.id}
                  defaultChecked={values.tagIds.includes(tag.id)}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </fieldset>

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
