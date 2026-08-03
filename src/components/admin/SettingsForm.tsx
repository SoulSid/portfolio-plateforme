'use client';

import { useActionState, useState } from 'react';
import { Editor } from '@/components/editor/Editor';
import { uploadFromEditor } from '@/components/editor/uploadFromEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveSettings, type FormState } from '@/app/admin/parametres/actions';

export interface SettingsValues {
  fullName: string;
  tagline: string;
  taglineEn: string;
  bio: string;
  bioEn: string;
  email: string;
  phone: string;
  location: string;
  avatarUrl: string;
  cvUrl: string;
  seoTitle: string;
  seoDesc: string;
  seoTitleEn: string;
  seoDescEn: string;
  linkedin: string;
  github: string;
  x: string;
}

const INITIAL: FormState = { error: null, saved: false };

export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, formAction, pending] = useActionState(saveSettings, INITIAL);
  const [bio, setBio] = useState(values.bio);
  const [bioEn, setBioEn] = useState(values.bioEn);

  const text = (name: keyof SettingsValues, label: string, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={values[name]} />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );

  return (
    <form action={formAction} className="max-w-3xl">
      <input type="hidden" name="bio" value={bio} />
      <input type="hidden" name="bioEn" value={bioEn} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">Paramètres du site</h1>
        <div className="flex items-center gap-3">
          {state.saved && <span className="font-mono text-xs text-muted">enregistré</span>}
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

      <div className="mt-6 space-y-6">
        <section className="grid gap-4 sm:grid-cols-2">
          {text('fullName', 'Nom affiché')}
          {text('location', 'Localisation', 'Exemple : Dakar, Sénégal')}
          {text('email', 'E-mail public')}
          {text('phone', 'Téléphone', 'Laissez vide pour ne pas le publier.')}
        </section>

        <section className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Phrase de présentation (FR)</Label>
            <Textarea id="tagline" name="tagline" defaultValue={values.tagline} required />
            <p className="text-xs text-muted">Grand titre de la page d&apos;accueil.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="taglineEn">Phrase de présentation (EN)</Label>
            <Textarea id="taglineEn" name="taglineEn" defaultValue={values.taglineEn} />
          </div>
        </section>

        <section className="space-y-2">
          <Label>Biographie (FR)</Label>
          <Editor value={values.bio} onChange={setBio} onUploadImage={uploadFromEditor} />
        </section>

        <section className="space-y-2">
          <Label>Biographie (EN)</Label>
          <Editor value={values.bioEn} onChange={setBioEn} onUploadImage={uploadFromEditor} />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {text('avatarUrl', 'URL de la photo', 'Copiez une URL depuis Médias.')}
          {text('cvUrl', 'URL du CV (PDF)')}
          {text('linkedin', 'LinkedIn')}
          {text('github', 'GitHub')}
          {text('x', 'X')}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {text('seoTitle', 'Titre SEO (FR)')}
          {text('seoTitleEn', 'Titre SEO (EN)')}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="seoDesc">Description SEO (FR)</Label>
            <Textarea id="seoDesc" name="seoDesc" defaultValue={values.seoDesc} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="seoDescEn">Description SEO (EN)</Label>
            <Textarea id="seoDescEn" name="seoDescEn" defaultValue={values.seoDescEn} />
          </div>
        </section>
      </div>
    </form>
  );
}
