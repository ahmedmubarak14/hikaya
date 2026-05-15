import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, leadingIcon, trailingIcon, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="text-surface/80 [lang=ar]:font-sansAr text-sm font-medium"
        >
          {label}
        </label>
      ) : null}

      <div
        className={cn(
          'relative flex items-center gap-2',
          'h-11 rounded-md px-4',
          'bg-surface/5 border-surface/15 border',
          'duration-fast transition-colors ease-out',
          'focus-within:border-accent focus-within:bg-surface/10',
          error && 'border-accent-secondary',
        )}
      >
        {leadingIcon ? <span className="text-surface/60">{leadingIcon}</span> : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'flex-1 bg-transparent outline-none',
            'text-surface placeholder:text-surface/40 text-base',
            '[lang=ar]:font-sansAr font-sans',
            // Arabic body sits ~10% larger at same weight to match optical size.
            '[lang=ar]:text-[1.05em]',
            className,
          )}
          {...rest}
        />
        {trailingIcon ? <span className="text-surface/60">{trailingIcon}</span> : null}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-accent-secondary text-xs">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-surface/50 text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
