import * as React from 'react';
import { cn } from '@/lib/utils';

export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'border-line flex h-10 w-full rounded-md border bg-white px-3 text-sm',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
