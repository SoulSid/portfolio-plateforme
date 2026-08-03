import { prisma } from '@/lib/prisma';
import { CrudList, type CrudField, type CrudRow } from '@/components/admin/CrudList';
import { deleteEducation, saveEducation } from './actions';
import { year } from '@/lib/dates';

export const metadata = { title: 'Formations — Administration' };
export const dynamic = 'force-dynamic';

const FIELDS: CrudField[] = [
  { name: 'school', label: 'Établissement', required: true },
  { name: 'degree', label: 'Diplôme (FR)', required: true },
  { name: 'degreeEn', label: 'Diplôme (EN)' },
  { name: 'field', label: 'Spécialité (FR)' },
  { name: 'fieldEn', label: 'Spécialité (EN)' },
  { name: 'startDate', label: 'Début', type: 'date' },
  { name: 'endDate', label: 'Fin', type: 'date' },
  { name: 'description', label: 'Description (FR)', type: 'textarea', width: 'full' },
  { name: 'descriptionEn', label: 'Description (EN)', type: 'textarea', width: 'full' },
  { name: 'order', label: 'Ordre', type: 'number', min: 0 },
];

const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

export default async function FormationsPage() {
  const education = await prisma.education.findMany({
    orderBy: [{ order: 'asc' }, { endDate: 'desc' }],
  });

  const rows: CrudRow[] = education.map((e) => ({
    id: e.id,
    primary: e.degree,
    secondary: `${e.school}${e.endDate ? ` · ${year(e.endDate)}` : ''}`,
    values: {
      school: e.school,
      degree: e.degree,
      degreeEn: e.degreeEn ?? '',
      field: e.field ?? '',
      fieldEn: e.fieldEn ?? '',
      startDate: isoDay(e.startDate),
      endDate: isoDay(e.endDate),
      description: e.description ?? '',
      descriptionEn: e.descriptionEn ?? '',
      order: String(e.order),
    },
  }));

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight">Formations</h1>
      <p className="mt-2 mb-6 text-sm text-muted">Cursus affiché sur la page Profil.</p>
      <CrudList
        fields={FIELDS}
        rows={rows}
        save={saveEducation}
        remove={deleteEducation}
        addLabel="Nouvelle formation"
        emptyLabel="Aucune formation."
      />
    </>
  );
}
