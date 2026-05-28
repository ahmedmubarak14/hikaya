import Image from 'next/image';

import { cn } from '@/lib/utils';

interface Props {
  /** 0-100 fill of the avatar ring. */
  percent: number;
  score: number;
  scoreLabel: string;
  title: string;
  body: string;
  avatarUrl: string | null;
  fallbackInitial: string;
  className?: string;
}

export function DiscoveryScore({
  percent,
  score,
  scoreLabel,
  title,
  body,
  avatarUrl,
  fallbackInitial,
  className,
}: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 50;
  const stroke = 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <section
      className={cn(
        'border-line/60 flex flex-col items-center gap-6 rounded-2xl border bg-paper p-6 sm:flex-row',
        className,
      )}
    >
      <div className="relative h-28 w-28 shrink-0">
        <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-surface/10"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-accent transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <span className="absolute inset-2 overflow-hidden rounded-full">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <span className="bg-accent/15 text-accent flex h-full w-full items-center justify-center text-2xl font-semibold">
              {fallbackInitial}
            </span>
          )}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-start">
        <h3 className="text-surface text-base font-semibold">{title}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-surface text-5xl font-semibold tracking-tight">{score}</span>
          <span className="text-muted text-sm">{scoreLabel}</span>
        </div>
        <p className="text-muted mt-1 max-w-md text-sm">{body}</p>
      </div>
    </section>
  );
}
