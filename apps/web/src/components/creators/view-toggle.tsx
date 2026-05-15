'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { cn } from '@hikaya/ui';

export type DiscoverView = 'people' | 'projects';

interface Props {
  view: DiscoverView;
  labels: { people: string; projects: string };
  /**
   * When provided, switches via local state on click instead of (only) via
   * URL navigation. Used in the static-export build where the server can't
   * react to URL changes — the client switcher reads + writes URL itself
   * to keep the choice bookmarkable.
   */
  onChange?: (next: DiscoverView) => void;
}

/**
 * Pill-style segmented toggle between Projects / People. Uses `<Link>` so the
 * URL is the source of truth (`?view=projects|people`) and the choice is
 * bookmarkable. Existing search params are preserved.
 */
export function ViewToggle({ view, labels, onChange }: Props) {
  const pathname = usePathname();
  const params = useSearchParams();

  const hrefFor = (next: DiscoverView): string => {
    const sp = new URLSearchParams(params);
    if (next === 'people') sp.delete('view');
    else sp.set('view', next);
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const tabs: { id: DiscoverView; label: string }[] = [
    { id: 'projects', label: labels.projects },
    { id: 'people', label: labels.people },
  ];

  return (
    <div
      role="tablist"
      aria-label="View"
      className="border-surface/15 bg-surface/[0.04] inline-flex items-center gap-1 rounded-full border p-1"
    >
      {tabs.map((tab) => {
        const active = tab.id === view;
        return (
          <Link
            key={tab.id}
            href={hrefFor(tab.id)}
            role="tab"
            aria-selected={active}
            scroll={false}
            onClick={
              onChange
                ? () => {
                    onChange(tab.id);
                  }
                : undefined
            }
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-full px-5 text-sm transition-colors',
              active ? 'bg-surface text-bg' : 'text-surface/70 hover:text-surface',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
