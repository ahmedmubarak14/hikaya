import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../utils/cn';

export const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-sans font-medium tracking-tight',
    'rounded-full border border-transparent',
    'transition-[transform,background-color,color,border-color] duration-fast ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:opacity-40 disabled:pointer-events-none',
    // Arabic body sits ~10% larger at same weight to match optical size.
    '[lang=ar]:font-sansAr [lang=ar]:text-[1.05em]',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-accent text-ink hover:scale-[1.02] active:scale-[0.99]',
        secondary: 'bg-surface text-ink hover:bg-surface/90 active:scale-[0.99]',
        ghost: 'bg-transparent text-surface hover:bg-surface/10 active:bg-surface/15',
        outline:
          'bg-transparent text-surface border-surface/30 hover:bg-surface/5 hover:border-surface/60',
        destructive: 'bg-accent-secondary text-surface hover:brightness-110 active:scale-[0.99]',
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
