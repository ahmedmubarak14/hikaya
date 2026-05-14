import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../utils/cn';

const badgeVariants = cva(
  cn(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
    'text-xs font-medium leading-5',
  ),
  {
    variants: {
      tone: {
        neutral: 'bg-surface/10 text-surface/80',
        // accent is yellow-green — readable only when used as a fill, not as
        // text-color. Use solid fill with ink text so it works in both themes.
        accent: 'bg-accent text-ink',
        sage: 'bg-sage/15 text-sage',
        info: 'bg-info/15 text-info',
        purple: 'bg-purple/15 text-purple',
        warning: 'bg-accent-secondary/15 text-accent-secondary',
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
