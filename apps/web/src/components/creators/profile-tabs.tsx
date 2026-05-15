'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { cn } from '@hikaya/ui';

export type ProfileTab = 'work' | 'store' | 'about';

interface Props {
  active: ProfileTab;
  labels: { work: string; store: string; about: string };
  /** When false, the Store tab is rendered as a disabled hint instead of a link. */
  storeEnabled: boolean;
}

/**
 * Instagram-style underline tab nav for the profile page. Drives the
 * `?tab=work|store|about` URL param so the active section is bookmarkable and
 * the page itself stays server-rendered.
 */
export function ProfileTabs({ active, labels, storeEnabled }: Props) {
  const pathname = usePathname();
  const params = useSearchParams();

  const hrefFor = (next: ProfileTab): string => {
    const sp = new URLSearchParams(params);
    if (next === 'work') sp.delete('tab');
    else sp.set('tab', next);
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const tabs: { id: ProfileTab; label: string; disabled?: boolean }[] = [
    { id: 'work', label: labels.work },
    { id: 'store', label: labels.store, disabled: !storeEnabled },
    { id: 'about', label: labels.about },
  ];

  // These are route-driven section links, not a managed tabs widget. Using
  // <nav> + aria-current="page" tells screen readers it's navigation, not a
  // tablist (which would imply tabpanel relationships + arrow-key behavior
  // that don't exist here).
  return (
    <nav
      aria-label="Profile sections"
      className="border-surface/10 flex items-center justify-center gap-1 border-b"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        if (tab.disabled) {
          return (
            <span
              key={tab.id}
              aria-disabled
              className="text-surface/30 inline-flex h-12 cursor-not-allowed items-center px-5 text-sm uppercase tracking-wide"
            >
              {tab.label}
            </span>
          );
        }
        return (
          <Link
            key={tab.id}
            href={hrefFor(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            scroll={false}
            className={cn(
              'relative inline-flex h-12 items-center px-5 text-sm uppercase tracking-wide transition-colors',
              isActive ? 'text-surface' : 'text-surface/50 hover:text-surface/80',
            )}
          >
            {tab.label}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-3 -bottom-px h-0.5 rounded-full transition-colors',
                isActive ? 'bg-surface' : 'bg-transparent',
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
