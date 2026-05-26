import Link from 'next/link';

import { Button } from '@hikaya/ui';

/**
 * Polished empty-state card used across both public and authenticated pages.
 * Shows a headline, subtitle, and optional CTA button. The subtle gradient
 * background makes it feel intentional rather than broken.
 */
export function EmptyState({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  icon,
}: {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Optional single-character or short text rendered as a large decorative element */
  icon?: string;
}) {
  return (
    <div className="from-surface/[0.02] via-surface/[0.05] to-surface/[0.02] relative mt-6 overflow-hidden rounded-2xl border border-surface/10 bg-gradient-to-br px-8 py-14 text-center">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-16 -end-16 h-48 w-48 rounded-full bg-accent/[0.04]" />
      <div className="pointer-events-none absolute -bottom-10 -start-10 h-32 w-32 rounded-full bg-accent-secondary/[0.04]" />

      {icon ? (
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface/[0.06] text-2xl">
          {icon}
        </div>
      ) : null}

      <h3 className="text-surface text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-surface/55 mx-auto mt-3 max-w-md text-sm leading-relaxed">{subtitle}</p>

      {ctaLabel && ctaHref ? (
        <div className="mt-7">
          <Link href={ctaHref}>
            <Button size="md" variant="primary">
              {ctaLabel}
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
