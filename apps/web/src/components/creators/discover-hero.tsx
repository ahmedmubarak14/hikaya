'use client';

import { useState } from 'react';

import { cn } from '@hikaya/ui';

interface Props {
  title: string;
  placeholder: string;
  searchLabel: string;
  /**
   * Optional callback fired with the typed query. Today the discover grid is
   * server-rendered, so we let the URL-driven FilterBar do real filtering and
   * keep the search input as a visual hero element. Wire this when the API
   * lands.
   */
  onSearch?: (q: string) => void;
}

/**
 * Contra-style centered search hero. Bold sans-serif heading sits over a
 * full-width pill input with a magnifying-glass affordance on the leading edge
 * and a dark "Search" pill on the trailing edge.
 *
 * The input is purely visual for now — the FilterBar below it handles the
 * structured filtering (city / discipline / availability). When we wire a real
 * search endpoint, the form submit can call into it.
 */
export function DiscoverHero({ title, placeholder, searchLabel, onSearch }: Props) {
  const [q, setQ] = useState('');

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 pb-10 text-center md:pb-12">
      <h1 className="text-balance text-4xl font-bold tracking-tight text-surface md:text-5xl lg:text-6xl">
        {title}
      </h1>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch?.(q.trim());
        }}
        className={cn(
          'relative flex h-14 w-full items-center rounded-full border border-surface/15 bg-bg pe-2 ps-5',
          'shadow-[0_1px_0_rgba(0,0,0,0.02),0_8px_24px_-12px_rgba(0,0,0,0.18)]',
          'focus-within:border-surface/40',
        )}
      >
        <SearchIcon className="me-3 h-5 w-5 shrink-0 text-surface/40" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-full flex-1 bg-transparent text-base text-surface placeholder:text-surface/40 focus:outline-none"
        />
        <button
          type="submit"
          className={cn(
            'ms-2 inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-surface px-6 text-sm font-medium text-bg',
            'transition-transform hover:scale-[1.02] active:scale-[0.99]',
          )}
        >
          {searchLabel}
        </button>
      </form>
    </section>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
