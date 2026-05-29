'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { ProfileTabs, type ProfileTab } from './profile-tabs';

interface Props {
  initial: ProfileTab;
  labels: { work: string; store: string; about: string };
  storeEnabled: boolean;
  workNode: ReactNode;
  storeNode: ReactNode;
  aboutNode: ReactNode;
  /** Creator-defined section order. NULL = default ['work','store','about']. */
  sectionsOrder?: ProfileTab[] | null;
}

/**
 * Client-side switcher for the Work / Store / About tabs on the talent
 * profile. Same reasoning as `<DiscoverViewSwitcher>`: in static export
 * the page can't read `?tab=` server-side per request, so render all three
 * panels and toggle visibility client-side. The tab nav still updates the
 * URL so the choice is shareable on the live build.
 */
export function ProfileTabsSwitcher({
  initial,
  labels,
  storeEnabled,
  workNode,
  storeNode,
  aboutNode,
  sectionsOrder,
}: Props) {
  const visible = sectionsOrder && sectionsOrder.length > 0
    ? sectionsOrder
    : (['work', 'store', 'about'] as ProfileTab[]);
  const [active, setActive] = useState<ProfileTab>(initial);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    const next: ProfileTab =
      t === 'store' && storeEnabled ? 'store' : t === 'about' ? 'about' : 'work';
    setActive(next);
    const onPopstate = () => {
      const p = new URLSearchParams(window.location.search);
      const t2 = p.get('tab');
      const n: ProfileTab =
        t2 === 'store' && storeEnabled ? 'store' : t2 === 'about' ? 'about' : 'work';
      setActive(n);
    };
    window.addEventListener('popstate', onPopstate);
    return () => window.removeEventListener('popstate', onPopstate);
  }, [storeEnabled]);

  return (
    <>
      <div className="mt-10">
        <ProfileTabs
          active={active}
          labels={labels}
          storeEnabled={storeEnabled}
          onChange={setActive}
          visibleSections={visible}
        />
      </div>

      <div className="mt-8">
        {visible.includes('work') ? <div hidden={active !== 'work'}>{workNode}</div> : null}
        {visible.includes('store') ? <div hidden={active !== 'store'}>{storeNode}</div> : null}
        {visible.includes('about') ? <div hidden={active !== 'about'}>{aboutNode}</div> : null}
      </div>
    </>
  );
}
