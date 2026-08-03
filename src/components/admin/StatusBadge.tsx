import { cn } from '@/lib/utils';

const LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  ARCHIVED: 'Archivé',
};

/**
 * Le phosphore ne sert QU'ICI et pour les résultats de lab — jamais en
 * décoration (section 6 du brief).
 */
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 font-mono text-xs',
        status === 'PUBLISHED' && 'bg-success/10 text-success',
        status === 'DRAFT' && 'border-line text-muted border',
        status === 'ARCHIVED' && 'text-muted bg-black/5',
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
