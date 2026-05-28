import Link from 'next/link';
import { type ReactNode } from 'react';

import { Button } from '@hikaya/ui';

import { cn } from '@/lib/utils';

interface Props {
  icon?: ReactNode;
  title: string;
  body?: string;
  cta?: {
    href?: string;
    onClick?: () => void;
    label: string;
  };
  secondaryCta?: {
    href?: string;
    label: string;
  };
  className?: string;
}

export function EmptyState({ icon, title, body, cta, secondaryCta, className }: Props) {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-md flex-col items-center justify-center px-6 py-20 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="bg-accent/10 text-accent mb-6 flex h-24 w-24 items-center justify-center rounded-full">
          {icon}
        </div>
      ) : null}
      <h2 className="text-surface text-lg font-semibold tracking-tight">{title}</h2>
      {body ? <p className="text-muted mt-2 text-sm leading-relaxed">{body}</p> : null}
      {cta || secondaryCta ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {cta?.href ? (
            <Link href={cta.href}>
              <Button variant="primary" size="md">
                {cta.label}
              </Button>
            </Link>
          ) : cta ? (
            <Button variant="primary" size="md" onClick={cta.onClick}>
              {cta.label}
            </Button>
          ) : null}
          {secondaryCta?.href ? (
            <Link href={secondaryCta.href}>
              <Button variant="outline" size="md">
                {secondaryCta.label}
              </Button>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
