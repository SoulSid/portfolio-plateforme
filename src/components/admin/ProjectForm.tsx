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
import { saveProject, type FormState } from '@/app/admin/projets/actions';

export interface ProjectFormValues {
  id: string | null;
  title: string;
  slug: string;
  summary: string;
  content: string;
  client: string;
  role: string;
  repoUrl: string;
  demoUrl: string;
  startedAt: string;
  finishedAt: string;
  status: string;
  featured: boolean;
  order: number;
  tagIds: string[];
}

interface Props {
  values: ProjectFormValues;
  allTags: { id: string; name: string; kind: string }[];
}

const INITIAL: FormState = { error: null };
const AUTOSAVE_MS = 20_000;

export function ProjectForm({ values, allTags }: Props) {
  const save = saveProject.bind(null, values.id);
  const [state, formAction, pending] = useActionState(save, INITIAL);

  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.slug));
  const [content, setContent] = useState(values.content);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  /* Slug dérivé du titre tant que l'auteur ne l'a pas modifié à la main. */
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const markDirty = useCallback(() => setDirty(true), []);

  /* Enregistrement automatique du brouillon toutes les 20 s (exigence section 5). */
  useEffect(() => {
    if (!values.id) return; // une entrée jamais enregistrée n'a pas d'id : pas d'autosave
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
          {values.id ? 'Modifier le projet' : 'Nouveau projet'}
        </h1>
        <div className="flex items-center gap-3">
          {savedAt && <span className="font-mono text-xs text-muted">enregistré {savedAt}</span>}
          <Link href="/admin/projets" className="text-sm text-muted hover:text-text">
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
          <p className="text-xs text-muted">
            Généré depuis le titre. Modifiable — attention, changer le slug change l&apos;URL
            publique.
          </p>
          {err('slug') && <p className="text-xs text-red-700">{err('slug')}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="summary">Résumé</Label>
          <Textarea id="summary" name="summary" defaultValue={values.summary} required />
          <p className="text-xs text-muted">Une à deux phrases, affichées sur la carte du projet.</p>
          {err('summary') && <p className="text-xs text-red-700">{err('summary')}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Contenu</Label>
          <Editor
            value={values.content}
            onChange={(html) => {
              setContent(html);
              markDirty();
            }}
            onUploadImage={uploadFromEditor}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="client">Client</Label>
            <Input id="client" name="client" defaultValue={values.client} />
            <p className="text-xs text-muted">Vide si projet personnel.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Rôle</Label>
            <Input id="role" name="role" defaultValue={values.role} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repoUrl">Dépôt</Label>
            <Input id="repoUrl" name="repoUrl" type="url" defaultValue={values.repoUrl} />
            {err('repoUrl') && <p className="text-xs text-red-700">{err('repoUrl')}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demoUrl">Démo</Label>
            <Input id="demoUrl" name="demoUrl" type="url" defaultValue={values.demoUrl} />
            {err('demoUrl') && <p className="text-xs text-red-700">{err('demoUrl')}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="startedAt">Début</Label>
            <Input id="startedAt" name="startedAt" type="date" defaultValue={values.startedAt} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="finishedAt">Fin</Label>
            <Input id="finishedAt" name="finishedAt" type="date" defaultValue={values.finishedAt} />
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

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="status">Statut</Label>
            <Select id="status" name="status" defaultValue={values.status}>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="ARCHIVED">Archivé</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="order">Ordre</Label>
            <Input id="order" name="order" type="number" min={0} defaultValue={values.order} />
          </div>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
            <input type="checkbox" name="featured" defaultChecked={values.featured} />
            Mettre en avant
          </label>
        </div>
      </div>
    </form>
  );
}
