'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Suppression en deux temps : un premier clic révèle la confirmation.
 * Une suppression est irréversible — elle ne doit jamais partir sur un clic seul.
 */
export function DeleteButton({
  action,
  label,
  confirmLabel,
}: {
  action: () => Promise<void>;
  label: string;
  confirmLabel: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setArmed(true)}>
        {label}
      </Button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <Button type="submit" variant="danger" size="sm">
        {confirmLabel}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setArmed(false)}>
        Annuler
      </Button>
    </form>
  );
}
