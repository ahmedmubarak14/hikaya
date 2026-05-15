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
        'border-surface/10 bg-surface/[0.03] rounded-2xl border',
        'duration-base transition-[transform,border-color,background-color] ease-out',
        interactive &&
          'hover:border-surface/30 hover:bg-surface/[0.06] cursor-pointer hover:-translate-y-0.5',
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
