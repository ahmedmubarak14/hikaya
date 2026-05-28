import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type Tone = 'accent' | 'sage' | 'purple' | 'info' | 'neutral';

interface Props {
  icon?: ReactNode;
  label: string;
  value: string;
  tag?: string;
  tone?: Tone;
  className?: string;
}

const TONES: Record<Tone, { bg: string; chip: string; tag: string }> = {
  accent: { bg: 'bg-accent/10', chip: 'bg-accent/20 text-accent', tag: 'text-accent' },
  sage: { bg: 'bg-sage/10', chip: 'bg-sage/20 text-sage', tag: 'text-sage' },
  purple: { bg: 'bg-purple/10', chip: 'bg-purple/20 text-purple', tag: 'text-purple' },
  info: { bg: 'bg-info/10', chip: 'bg-info/20 text-info', tag: 'text-info' },
  neutral: { bg: 'bg-surface/[0.04]', chip: 'bg-surface/10 text-surface/70', tag: 'text-muted' },
};

export function StatCard({ icon, label, value, tag, tone = 'neutral', className }: Props) {
  const t = TONES[tone];
  return (
    <div
      className={cn(
        'border-line/60 relative flex items-center gap-4 overflow-hidden rounded-xl border p-5',
        t.bg,
        className,
      )}
    >
      {icon ? (
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', t.chip)}>
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="text-surface text-2xl font-semibold tracking-tight">{value}</div>
        <div className="text-muted mt-0.5 text-xs uppercase tracking-wider">{label}</div>
      </div>
      {tag ? (
        <span
          className={cn(
            'absolute end-3 top-3 text-[10px] font-medium uppercase tracking-wider',
            t.tag,
          )}
        >
          {tag}
        </span>
      ) : null}
    </div>
  );
}
