import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** When true, applies the editorial hover rise and accent edge. */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-surface/10 bg-bg/45 shadow-sm shadow-ink/5',
        'duration-base transition-[transform,border-color,background-color,box-shadow] ease-out',
        interactive &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-surface/25 hover:bg-bg/75 hover:shadow-md hover:shadow-ink/10',
        className,
      )}
      {...rest}
    />
  );
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('p-6 pb-2', className)} {...rest} />;
  },
);

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardBody({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('p-6', className)} {...rest} />;
  },
);

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between gap-3 p-6 pt-2', className)}
        {...rest}
      />
    );
  },
);
