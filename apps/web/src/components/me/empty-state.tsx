import Link from 'next/link';

import { cn } from '@/lib/utils';

interface CTA {
  href?: string;
  label: string;
}

interface Props {
  title: string;
  body?: string;
  cta?: CTA;
  secondaryCta?: CTA;
  /** Number of skeleton placeholder blocks to render behind the text (Contra style). */
  skeletonCount?: number;
  className?: string;
}

export function EmptyState({
  title,
  body,
  cta,
  secondaryCta,
  skeletonCount = 4,
  className,
}: Props) {
  return (
    <div className={cn('relative mx-auto w-full max-w-4xl px-6 py-16', className)}>
      <div
        aria-hidden
        className="pointer-events-none mb-8 grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${skeletonCount}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="bg-surface/[0.04] aspect-[5/4] rounded-xl"
          />
        ))}
      </div>

      <div className="relative -mt-32 flex flex-col items-center text-center">
        <h2 className="text-surface text-xl font-semibold tracking-tight">{title}</h2>
        {body ? (
          <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-relaxed">{body}</p>
        ) : null}
        {cta || secondaryCta ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {cta?.href ? (
              <Link
                href={cta.href}
                className="bg-surface text-bg hover:bg-surface/90 inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors"
              >
                {cta.label}
              </Link>
            ) : null}
            {secondaryCta?.href ? (
              <Link
                href={secondaryCta.href}
                className="border-line/80 text-surface hover:bg-surface/[0.04] inline-flex h-10 items-center rounded-full border px-5 text-sm font-medium transition-colors"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
