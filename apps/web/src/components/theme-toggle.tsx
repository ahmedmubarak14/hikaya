'use client';

import { useEffect, useState, useTransition } from 'react';

import { setTheme as setThemeCookie } from '@/lib/theme/actions';

type Theme = 'light' | 'dark';

interface Props {
  initial: Theme;
  labels: { switchToLight: string; switchToDark: string };
}

/**
 * Theme toggle. The cookie is set server-side so the next SSR render matches;
 * the DOM attribute is flipped synchronously so the current page repaints
 * without a flash. In static-export builds the server action is a no-op — we
 * still flip the DOM + localStorage so the choice sticks on reload via the
 * anti-FOUC inline script.
 */
export function ThemeToggle({ initial, labels }: Props) {
  const [theme, setTheme] = useState<Theme>(initial);
  const [, startTransition] = useTransition();

  // Sync local state with whatever the anti-FOUC script picked from localStorage.
  useEffect(() => {
    const fromDom = document.documentElement.dataset.theme;
    if (fromDom === 'light' || fromDom === 'dark') setTheme(fromDom);
  }, []);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const label = theme === 'dark' ? labels.switchToLight : labels.switchToDark;

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem('hikaya_theme', next);
    } catch {
      // Storage blocked — fine, cookie still persists in non-export builds.
    }
    setTheme(next);
    startTransition(() => {
      // Best-effort cookie write; a noop in static export.
      void setThemeCookie(next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="border-surface/15 text-surface/70 hover:border-surface/40 hover:text-surface grid h-9 w-9 place-items-center rounded-full border transition-colors"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
