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
          className="text-sm font-medium text-surface/80 [lang=ar]:font-sansAr"
        >
          {label}
        </label>
      ) : null}

      <div
        className={cn(
          'relative flex items-center gap-2',
          'h-11 px-4 rounded-md',
          'bg-surface/5 border border-surface/15',
          'transition-colors duration-fast ease-out',
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
            'text-base text-surface placeholder:text-surface/40',
            'font-sans [lang=ar]:font-sansAr',
            // Arabic body sits ~10% larger at same weight to match optical size.
            '[lang=ar]:text-[1.05em]',
            className,
          )}
          {...rest}
        />
        {trailingIcon ? <span className="text-surface/60">{trailingIcon}</span> : null}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-accent-secondary">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-surface/50">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
