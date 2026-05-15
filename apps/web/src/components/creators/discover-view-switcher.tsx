'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { ViewToggle, type DiscoverView } from './view-toggle';

interface Props {
  initial: DiscoverView;
  labels: { projects: string; people: string };
  peopleNode: ReactNode;
  projectsNode: ReactNode;
}

/**
 * Client-side switcher for the Projects ↔ People view on `/discover`.
 *
 * Why a client wrapper: in the live build the page reads `?view=` from
 * `searchParams` and the server re-renders. In the static export build there
 * IS no server, and `searchParams` are stripped at prerender time — clicking
 * the toggle would just navigate to a URL that resolves to the same HTML.
 *
 * Solution: render both grids on the server, hide the inactive one, and let
 * a tiny client state flip the visible variant. The toggle still updates
 * the URL via `<Link>` so the choice is bookmarkable in the live build.
 */
export function DiscoverViewSwitcher({ initial, labels, peopleNode, projectsNode }: Props) {
  const [active, setActive] = useState<DiscoverView>(initial);

  // Honor `?view=` on first paint when the inline anti-FOUC script is unable
  // to (this runs after hydration). Cheap because the search-params read is
  // sync.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'projects' || v === 'people') setActive(v);
    // Listen for in-page nav (the toggle uses <Link>) so client-side state
    // stays in sync with the URL.
    const onPopstate = () => {
      const p = new URLSearchParams(window.location.search);
      const next = p.get('view');
      setActive(next === 'projects' ? 'projects' : 'people');
    };
    window.addEventListener('popstate', onPopstate);
    return () => window.removeEventListener('popstate', onPopstate);
  }, []);

  return (
    <>
      <div className="mb-6 flex justify-center">
        <ViewToggle view={active} labels={labels} onChange={setActive} />
      </div>
      <div hidden={active !== 'people'}>{peopleNode}</div>
      <div hidden={active !== 'projects'}>{projectsNode}</div>
    </>
  );
}
