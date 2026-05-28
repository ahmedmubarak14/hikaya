import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface Props {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Optional footer (e.g. Save button row). */
  footer?: ReactNode;
}

export function FormSection({ title, description, children, footer, className }: Props) {
  return (
    <section className={cn('mb-10', className)}>
      {title || description ? (
        <header className="mb-4">
          {title ? (
            <h2 className="text-surface text-base font-semibold">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-muted mt-1 text-sm">{description}</p>
          ) : null}
        </header>
      ) : null}
      <div className="border-line/60 divide-line/60 divide-y rounded-xl border bg-bg/40">
        {children}
      </div>
      {footer ? <div className="mt-4 flex justify-end">{footer}</div> : null}
    </section>
  );
}
