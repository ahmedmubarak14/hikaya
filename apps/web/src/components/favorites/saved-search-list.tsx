'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { deleteSavedSearchAction } from '@/lib/creators/actions';

interface SavedSearch {
  id: string;
  name: string;
  filterParams: Record<string, string>;
  createdAt: string;
}

interface Props {
  searches: SavedSearch[];
  locale: Locale;
}

export function SavedSearchList({ searches, locale }: Props) {
  const t = useTranslations('favorites');
  const tCities = useTranslations('cities');
  const tDisciplines = useTranslations('disciplines');

  if (searches.length === 0) {
    return (
      <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
        <p className="text-surface/70 text-lg">{t('searchesEmpty')}</p>
        <p className="text-surface/40 mt-2 text-sm">{t('searchesEmptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {searches.map((search) => (
        <SavedSearchRow
          key={search.id}
          search={search}
          locale={locale}
          tCities={tCities}
          tDisciplines={tDisciplines}
        />
      ))}
    </div>
  );
}

// Discipline key map for translations — same as filter-bar
const DISCIPLINE_KEYS: Record<string, string> = {
  WEDDING_PHOTOGRAPHY: 'weddingPhoto',
  PORTRAIT_PHOTOGRAPHY: 'portraitPhoto',
  COMMERCIAL_PHOTOGRAPHY: 'commercialPhoto',
  PRODUCT_PHOTOGRAPHY: 'productPhoto',
  EVENT_PHOTOGRAPHY: 'eventPhoto',
  FASHION_PHOTOGRAPHY: 'fashionPhoto',
  COMMERCIAL_VIDEO: 'commercialVideo',
  WEDDING_VIDEO: 'weddingVideo',
  EVENT_VIDEO: 'eventVideo',
  DOCUMENTARY: 'documentary',
  GRAPHIC_DESIGN: 'graphicDesign',
  BRAND_IDENTITY: 'brandIdentity',
  MOTION_GRAPHICS: 'motionGraphics',
  VIDEO_EDITING: 'videoEditing',
  COLOR_GRADING: 'colorGrading',
  RETOUCHING: 'retouching',
  DRONE_OPERATION: 'drone',
};

function SavedSearchRow({
  search,
  locale,
  tCities,
  tDisciplines,
}: {
  search: SavedSearch;
  locale: Locale;
  tCities: ReturnType<typeof useTranslations>;
  tDisciplines: ReturnType<typeof useTranslations>;
}) {
  const t = useTranslations('favorites');
  const [isPending, startTransition] = useTransition();
  const { city, discipline, available } = search.filterParams;

  const remove = () => {
    startTransition(() => {
      void deleteSavedSearchAction(locale, search.id);
    });
  };

  // Build the discover URL with the saved filter params
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (discipline) params.set('discipline', discipline);
  if (available === '1') params.set('available', '1');
  const discoverUrl = `/${locale}/discover${params.toString() ? `?${params.toString()}` : ''}`;

  // Human-readable filter description
  const filters: string[] = [];
  if (city) {
    try {
      filters.push(tCities(city as 'RIYADH'));
    } catch {
      filters.push(city);
    }
  }
  if (discipline && DISCIPLINE_KEYS[discipline]) {
    try {
      filters.push(tDisciplines(DISCIPLINE_KEYS[discipline] as 'weddingPhoto'));
    } catch {
      filters.push(discipline);
    }
  }
  if (available === '1') filters.push(t('availableFilter'));

  return (
    <div
      className={cn(
        'border-surface/10 bg-surface/[0.03] flex items-center justify-between gap-4 rounded-xl border p-5',
        isPending && 'opacity-60',
      )}
    >
      <div className="flex flex-col gap-1">
        <Link
          href={discoverUrl}
          className="text-surface text-base font-semibold underline-offset-2 hover:underline"
        >
          {search.name}
        </Link>
        {filters.length > 0 ? (
          <p className="text-surface/60 text-sm">{filters.join(' · ')}</p>
        ) : (
          <p className="text-surface/40 text-sm">{t('allCreators')}</p>
        )}
        <p className="text-surface/40 text-xs">
          {new Date(search.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={discoverUrl}
          className="text-accent-secondary text-xs font-medium transition-colors hover:underline"
        >
          {t('runSearch')}
        </Link>
        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          className="text-surface/60 hover:text-accent-secondary text-xs transition-colors"
        >
          {t('removeSearch')}
        </button>
      </div>
    </div>
  );
}
