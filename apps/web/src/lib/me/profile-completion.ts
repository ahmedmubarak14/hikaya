import { type Locale } from '@/i18n/config';
import { type getMyCreatorProfile } from '@/lib/creators/queries';

export type Creator = Awaited<ReturnType<typeof getMyCreatorProfile>>;

export type ActionItemId = 'bio' | 'rate' | 'work' | 'location';

export interface ProfileActionItem {
  id: ActionItemId;
  /** Translation key under `me.actions` */
  labelKey: ActionItemId;
  href: string;
  done: boolean;
}

/**
 * Single source of truth for profile-completion state. Used by the sidebar
 * ring AND the dashboard ActionItemsCard so the two never drift.
 *
 * Each item maps to a real input field on /me/portfolio so checking it off
 * is achievable from the UI.
 */
export function getProfileActionItems(creator: Creator, locale: Locale): ProfileActionItem[] {
  const portfolio = `/${locale}/me/portfolio`;
  return [
    {
      id: 'bio',
      labelKey: 'bio',
      href: portfolio,
      done: Boolean(creator?.bioEn || creator?.bioAr),
    },
    {
      id: 'rate',
      labelKey: 'rate',
      href: portfolio,
      done: Boolean(creator?.startingPriceSar),
    },
    {
      id: 'work',
      labelKey: 'work',
      href: portfolio,
      done: Boolean(creator?.disciplines && creator.disciplines.length > 0),
    },
    {
      id: 'location',
      labelKey: 'location',
      href: portfolio,
      done: Boolean(creator?.city),
    },
  ];
}

export function getProfileCompletionPercent(items: ProfileActionItem[]): number {
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.done).length;
  return Math.round((done / items.length) * 100);
}
