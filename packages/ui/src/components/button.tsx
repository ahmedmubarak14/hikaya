import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../utils/cn';

export const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-sans font-medium tracking-tight',
    'rounded-full border border-transparent',
    'shadow-sm shadow-ink/5 transition-[transform,background-color,color,border-color,box-shadow] duration-fast ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:opacity-40 disabled:pointer-events-none',
    // Arabic body sits ~10% larger at same weight to match optical size.
    '[lang=ar]:font-sansAr [lang=ar]:text-[1.05em]',
  ),
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--accent)] text-[var(--ink)] hover:scale-[1.01] hover:shadow-md hover:shadow-ink/10 active:scale-[0.99]',
        secondary: 'bg-surface text-bg hover:bg-surface/90 active:scale-[0.99]',
        ghost: 'bg-transparent text-surface hover:bg-surface/10 active:bg-surface/15',
        outline:
          'bg-bg/40 text-surface border-surface/20 hover:bg-surface/5 hover:border-surface/45',
        destructive:
          'bg-[var(--accent-secondary)] text-[var(--ink)] hover:brightness-105 active:scale-[0.99]',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Visual loading state — disables interaction and dims content. */
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, isLoading, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {children}
    </button>
  );
});
