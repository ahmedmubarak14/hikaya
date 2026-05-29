'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/lib/utils';

export type ProfileSection = 'work' | 'store' | 'about';

const ALL: ProfileSection[] = ['work', 'store', 'about'];

interface Props {
  /** Comma-separated string; '' = platform default. */
  value: string;
  onChange: (next: string) => void;
}

/**
 * Visible-section reorder + show/hide control for the public profile.
 * Stores the result as a comma-separated string so the existing FormData
 * pipeline doesn't change. Sections omitted from the list are hidden.
 */
export function SectionsOrderInput({ value, onChange }: Props) {
  const t = useTranslations('portfolioEditor.profile');
  const [order, setOrder] = useState<ProfileSection[]>(() => {
    if (!value) return [...ALL];
    const parsed = value
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s): s is ProfileSection => ALL.includes(s as ProfileSection));
    return parsed.length > 0 ? parsed : [...ALL];
  });

  const sync = (next: ProfileSection[]) => {
    setOrder(next);
    onChange(next.join(','));
  };

  const move = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    sync(next);
  };

  const toggle = (section: ProfileSection) => {
    if (order.includes(section)) {
      sync(order.filter((s) => s !== section));
    } else {
      sync([...order, section]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <ul className="border-line/60 divide-line/60 divide-y rounded-lg border">
        {order.map((section, idx) => (
          <li key={section} className="flex items-center gap-3 px-3 py-2.5">
            <span className="text-muted w-5 text-center text-xs tabular-nums">{idx + 1}</span>
            <span className="text-surface flex-1 text-sm capitalize">
              {t(`sections.${section}` as 'sections.work')}
            </span>
            <button
              type="button"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              aria-label="Move up"
              className="text-muted hover:text-surface text-xs disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => move(idx, 1)}
              disabled={idx === order.length - 1}
              aria-label="Move down"
              className="text-muted hover:text-surface text-xs disabled:opacity-30"
            >
              ▼
            </button>
            <button
              type="button"
              onClick={() => toggle(section)}
              className="text-muted hover:text-orange text-xs"
            >
              {t('sectionsHide')}
            </button>
          </li>
        ))}
      </ul>
      {order.length < ALL.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted text-xs">{t('sectionsHidden')}:</span>
          {ALL.filter((s) => !order.includes(s)).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => toggle(section)}
              className={cn(
                'border-line/80 text-surface hover:bg-surface/[0.04]',
                'inline-flex items-center rounded-full border px-3 py-1 text-xs',
              )}
            >
              + {t(`sections.${section}` as 'sections.work')}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
