import { prisma } from '@/lib/prisma';
import { SettingsForm, type SettingsValues } from '@/components/admin/SettingsForm';

export const metadata = { title: 'Paramètres — Administration' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } });
  const socials = (settings?.socials ?? {}) as Record<string, string>;

  const values: SettingsValues = {
    fullName: settings?.fullName ?? '',
    tagline: settings?.tagline ?? '',
    taglineEn: settings?.taglineEn ?? '',
    bio: settings?.bio ?? '',
    bioEn: settings?.bioEn ?? '',
    email: settings?.email ?? '',
    phone: settings?.phone ?? '',
    location: settings?.location ?? '',
    avatarUrl: settings?.avatarUrl ?? '',
    cvUrl: settings?.cvUrl ?? '',
    seoTitle: settings?.seoTitle ?? '',
    seoDesc: settings?.seoDesc ?? '',
    seoTitleEn: settings?.seoTitleEn ?? '',
    seoDescEn: settings?.seoDescEn ?? '',
    linkedin: socials.linkedin ?? '',
    github: socials.github ?? '',
    x: socials.x ?? '',
  };

  return <SettingsForm values={values} />;
}
