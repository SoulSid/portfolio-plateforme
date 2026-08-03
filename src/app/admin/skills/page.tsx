import { prisma } from '@/lib/prisma';
import { CrudList, type CrudField, type CrudRow } from '@/components/admin/CrudList';
import { deleteSkill, saveSkill } from './actions';

export const metadata = { title: 'Compétences — Administration' };
export const dynamic = 'force-dynamic';

const FIELDS: CrudField[] = [
  { name: 'name', label: 'Nom', required: true },
  { name: 'category', label: 'Catégorie (FR)', required: true },
  { name: 'categoryEn', label: 'Catégorie (EN)', hint: 'Vide = le français est réutilisé.' },
  { name: 'level', label: 'Niveau (1 à 5)', type: 'number', min: 1, max: 5, required: true },
  { name: 'order', label: 'Ordre', type: 'number', min: 0 },
];

export default async function SkillsPage() {
  const skills = await prisma.skill.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] });

  const rows: CrudRow[] = skills.map((s) => ({
    id: s.id,
    primary: s.name,
    secondary: `${s.category} · niveau ${s.level}/5`,
    values: {
      name: s.name,
      category: s.category,
      categoryEn: s.categoryEn ?? '',
      level: String(s.level),
      order: String(s.order),
    },
  }));

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight">Compétences</h1>
      <p className="mt-2 mb-6 text-sm text-muted">{skills.length} compétences enregistrées.</p>
      <CrudList
        fields={FIELDS}
        rows={rows}
        save={saveSkill}
        remove={deleteSkill}
        addLabel="Nouvelle compétence"
        emptyLabel="Aucune compétence."
      />
    </>
  );
}
