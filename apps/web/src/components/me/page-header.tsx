'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface PageTab {
  href: string;
  label: string;
}

interface Props {
  title: string;
  tabs?: PageTab[];
  actions?: ReactNode;
}

export function PageHeader({ title, tabs, actions }: Props) {
  const pathname = usePathname();

  return (
    <div className="mb-6 px-8 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-surface text-3xl font-semibold tracking-tight">{title}</h1>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      {tabs && tabs.length > 0 ? (
        <nav className="border-line/40 mt-6 flex gap-6 border-b" aria-label="Tabs">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  '-mb-px border-b-2 pb-3 text-sm transition-colors',
                  active
                    ? 'text-surface border-surface font-medium'
                    : 'text-muted hover:text-surface border-transparent',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
