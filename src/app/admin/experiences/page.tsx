import { prisma } from '@/lib/prisma';
import { CrudList, type CrudField, type CrudRow } from '@/components/admin/CrudList';
import { deleteExperience, saveExperience } from './actions';
import { year } from '@/lib/dates';

export const metadata = { title: 'Expériences — Administration' };
export const dynamic = 'force-dynamic';

const FIELDS: CrudField[] = [
  { name: 'company', label: 'Entreprise', required: true },
  { name: 'role', label: 'Poste (FR)', required: true },
  { name: 'roleEn', label: 'Poste (EN)' },
  { name: 'location', label: 'Lieu' },
  { name: 'startDate', label: 'Début', type: 'date', required: true },
  { name: 'endDate', label: 'Fin', type: 'date', hint: 'Vide = poste actuel.' },
  { name: 'description', label: 'Description (FR)', type: 'textarea', required: true, width: 'full' },
  { name: 'descriptionEn', label: 'Description (EN)', type: 'textarea', width: 'full' },
  { name: 'order', label: 'Ordre', type: 'number', min: 0 },
];

const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

export default async function ExperiencesPage() {
  const experiences = await prisma.experience.findMany({
    orderBy: [{ order: 'asc' }, { startDate: 'desc' }],
  });

  const rows: CrudRow[] = experiences.map((e) => ({
    id: e.id,
    primary: `${e.role} — ${e.company}`,
    secondary: `${year(e.startDate)} → ${e.endDate ? year(e.endDate) : 'en cours'}`,
    values: {
      company: e.company,
      role: e.role,
      roleEn: e.roleEn ?? '',
      location: e.location ?? '',
      startDate: isoDay(e.startDate),
      endDate: isoDay(e.endDate),
      description: e.description,
      descriptionEn: e.descriptionEn ?? '',
      order: String(e.order),
    },
  }));

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight">Expériences</h1>
      <p className="mt-2 mb-6 text-sm text-muted">Parcours affiché sur la page Profil.</p>
      <CrudList
        fields={FIELDS}
        rows={rows}
        save={saveExperience}
        remove={deleteExperience}
        addLabel="Nouvelle expérience"
        emptyLabel="Aucune expérience."
      />
    </>
  );
}
