import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../utils/cn';

const badgeVariants = cva(
  cn(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
    'text-xs font-medium font-mono uppercase tracking-wider',
    '[lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case',
  ),
  {
    variants: {
      tone: {
        neutral: 'bg-surface/10 text-surface/80',
        accent: 'bg-accent/15 text-accent',
        sage: 'bg-sage/20 text-sage',
        info: 'bg-info/20 text-info',
        purple: 'bg-purple/20 text-purple',
        warning: 'bg-accent-secondary/20 text-accent-secondary',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone, ...rest },
  ref,
) {
  return <span ref={ref} className={cn(badgeVariants({ tone }), className)} {...rest} />;
});
