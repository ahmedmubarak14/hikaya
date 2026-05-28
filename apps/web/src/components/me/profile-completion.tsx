import { cn } from '@/lib/utils';

interface Props {
  /** 0-100 */
  percent: number;
  label: string;
  className?: string;
}

export function ProfileCompletion({ percent, label, className }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 12;
  const stroke = 2.5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn(
        'border-line/60 flex w-full items-center gap-2 rounded-lg border bg-bg/40 px-3 py-2',
        className,
      )}
    >
      <span className="relative inline-flex h-7 w-7 items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
          <circle
            cx="14"
            cy="14"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-surface/10"
          />
          <circle
            cx="14"
            cy="14"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-surface transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <span className="text-surface absolute text-[9px] font-semibold tabular-nums">
          {clamped}%
        </span>
      </span>
      <span className="text-surface min-w-0 truncate text-xs font-medium">{label}</span>
    </div>
  );
}
