import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface Props {
  label: string;
  description?: string;
  children: ReactNode;
  /** Stack label above the control instead of side-by-side. */
  stacked?: boolean;
  className?: string;
}

export function SettingRow({ label, description, children, stacked, className }: Props) {
  return (
    <div
      className={cn(
        'flex gap-6 px-5 py-5',
        stacked ? 'flex-col' : 'flex-col items-start sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className={cn('flex flex-col gap-1', stacked ? 'w-full' : 'sm:max-w-sm')}>
        <span className="text-surface text-sm font-medium">{label}</span>
        {description ? (
          <span className="text-muted text-xs leading-relaxed">{description}</span>
        ) : null}
      </div>
      <div className={cn(stacked ? 'w-full' : 'w-full sm:w-auto')}>{children}</div>
    </div>
  );
}
