import type { ReactNode } from 'react';

import { cn } from '@hikaya/ui';

interface Props {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'accent';
  children?: ReactNode;
}

export function StatTile({ label, value, hint, tone = 'neutral', children }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border p-5',
        tone === 'accent'
          ? 'border-accent/30 bg-accent/5'
          : 'border-surface/10 bg-surface/[0.03]',
      )}
    >
      <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
        {label}
      </span>
      <span className={cn('text-3xl font-display', tone === 'accent' ? 'text-accent' : 'text-surface')}>
        {value}
      </span>
      {hint ? <span className="text-sm text-surface/50">{hint}</span> : null}
      {children}
    </div>
  );
}
