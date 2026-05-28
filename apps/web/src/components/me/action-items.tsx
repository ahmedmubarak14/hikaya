'use client';

import Link from 'next/link';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

export interface ActionItem {
  id: string;
  label: string;
  href: string;
  done: boolean;
}

interface Props {
  title: string;
  groupLabel: string;
  percent: number;
  items: ActionItem[];
}

export function ActionItemsCard({ title, groupLabel, percent, items }: Props) {
  const [open, setOpen] = useState(true);
  const remaining = items.filter((i) => !i.done).length;

  return (
    <div className="border-line/60 rounded-2xl border bg-paper p-5">
      <div className="flex items-center gap-2">
        <h3 className="text-surface text-base font-semibold">{title}</h3>
        <span className="bg-accent-secondary/15 text-accent-secondary inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold">
          {remaining}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border-line/60 mt-4 flex w-full items-center gap-2 border-b pb-3 text-start"
      >
        <span className="text-surface text-sm font-medium">{groupLabel}</span>
        <span className="text-muted text-xs">({percent}%)</span>
        <span className="text-muted ms-auto text-xs">{remaining}</span>
        <ChevronDown
          size={14}
          className={cn('text-muted transition-transform', open ? '' : '-rotate-90 rtl:rotate-90')}
        />
      </button>

      {open ? (
        <ul className="mt-2 flex flex-col">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group hover:bg-surface/[0.03] flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors"
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                    item.done
                      ? 'bg-surface border-surface text-bg'
                      : 'border-line group-hover:border-surface/40',
                  )}
                >
                  {item.done ? <Check size={12} strokeWidth={2.5} /> : null}
                </span>
                <span
                  className={cn(
                    'flex-1 text-sm',
                    item.done ? 'text-muted line-through' : 'text-surface',
                  )}
                >
                  {item.label}
                </span>
                <ArrowRight
                  size={14}
                  className="text-muted/60 group-hover:text-muted shrink-0 transition-colors"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
