import { z } from 'zod';

/**
 * Schémas partagés client/serveur — un seul schéma par entité, comme le veut
 * la section 3 du brief. Ce qui passe ici passe en base.
 */

export const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export const TAG_KINDS = ['TECH', 'DOMAIN'] as const;

const statusSchema = z.enum(STATUSES);

/** Champ texte facultatif : une chaîne vide venant d'un formulaire devient null. */
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

/** Date facultative au format AAAA-MM-JJ. */
const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), 'Date invalide.')
  .transform((v) => (v === null ? null : new Date(v)));

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((v) => v === null || /^https?:\/\/.+/.test(v), 'URL invalide (http ou https attendu).');

const slugField = z
  .string()
  .trim()
  .min(1, 'Le slug est requis.')
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide : minuscules, chiffres et tirets uniquement.');

export const projectSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis.').max(160),
  slug: slugField,
  summary: z.string().trim().min(1, 'Le résumé est requis.').max(400),
  content: z.string(),
  client: optionalText,
  role: optionalText,
  repoUrl: optionalUrl,
  demoUrl: optionalUrl,
  startedAt: optionalDate,
  finishedAt: optionalDate,
  coverId: optionalText,
  status: statusSchema,
  featured: z.boolean(),
  order: z.coerce.number().int().min(0),
  tagIds: z.array(z.string()),
});

export const labSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis.').max(160),
  slug: slugField,
  objective: z.string().trim().min(1, "L'objectif est requis.").max(400),
  content: z.string(),
  takeaway: optionalText,
  seriesId: optionalText,
  dayNumber: z.coerce.number().int().min(1).nullable().or(z.literal(null)),
  durationHours: z.coerce.number().min(0).max(1000).nullable().or(z.literal(null)),
  difficulty: z.coerce.number().int().min(1).max(5).nullable().or(z.literal(null)),
  repoUrl: optionalUrl,
  coverId: optionalText,
  status: statusSchema,
  tagIds: z.array(z.string()),
});

export const seriesSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis.').max(160),
  slug: slugField,
  description: z.string().trim().min(1, 'La description est requise.').max(600),
  coverId: optionalText,
  status: statusSchema,
});

export const tagSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.').max(60),
  slug: slugField,
  kind: z.enum(TAG_KINDS),
  color: optionalText,
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type LabInput = z.infer<typeof labSchema>;
export type SeriesInput = z.infer<typeof seriesSchema>;
export type TagInput = z.infer<typeof tagSchema>;
