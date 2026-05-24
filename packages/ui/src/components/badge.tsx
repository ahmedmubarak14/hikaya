import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../utils/cn';

const badgeVariants = cva(
  cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5', 'text-xs font-medium leading-5'),
  {
    variants: {
      tone: {
        neutral: 'bg-surface/10 text-surface/75 ring-1 ring-surface/10',
        accent: 'bg-[var(--accent)]/25 text-surface ring-1 ring-[var(--accent)]/35',
        sage: 'bg-[var(--sage)]/18 text-surface ring-1 ring-[var(--sage)]/30',
        info: 'bg-[var(--info)]/18 text-surface ring-1 ring-[var(--info)]/30',
        purple: 'bg-[var(--purple)]/18 text-surface ring-1 ring-[var(--purple)]/30',
        warning:
          'bg-[var(--accent-secondary)]/18 text-surface ring-1 ring-[var(--accent-secondary)]/30',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone, ...rest },
  ref,
) {
  return <span ref={ref} className={cn(badgeVariants({ tone }), className)} {...rest} />;
});
