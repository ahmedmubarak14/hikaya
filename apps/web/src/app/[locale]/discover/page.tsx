import { Suspense } from 'react';

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CreatorCard } from '@/components/creators/creator-card';
import { FilterBar } from '@/components/creators/filter-bar';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import type { City, Discipline } from '@/lib/creators/mock-data';
import { listCreators } from '@/lib/creators/queries';
import { IS_STATIC_EXPORT } from '@/lib/static-export';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ city?: string; discipline?: string; available?: string }>;
}

const CITY_VALUES = new Set<City>([
  'RIYADH', 'JEDDAH', 'DAMMAM', 'KHOBAR', 'MAKKAH', 'MEDINA', 'TABUK', 'ABHA',
]);

const DISCIPLINE_VALUES = new Set<Discipline>([
  'WEDDING_PHOTOGRAPHY', 'PORTRAIT_PHOTOGRAPHY', 'COMMERCIAL_PHOTOGRAPHY',
  'PRODUCT_PHOTOGRAPHY', 'EVENT_PHOTOGRAPHY', 'FASHION_PHOTOGRAPHY',
  'COMMERCIAL_VIDEO', 'WEDDING_VIDEO', 'EVENT_VIDEO', 'DOCUMENTARY',
  'GRAPHIC_DESIGN', 'BRAND_IDENTITY', 'MOTION_GRAPHICS', 'VIDEO_EDITING',
  'COLOR_GRADING', 'RETOUCHING', 'DRONE_OPERATION',
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'discover' });
  return { title: t('title') };
}

export default async function DiscoverPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Skip searchParams in static export — Next would otherwise mark this page
  // dynamic and refuse the export. Filters work on the live build only.
  const sp = IS_STATIC_EXPORT ? {} : await searchParams;
  const { city: rawCity, discipline: rawDiscipline, available } = sp;

  const city = rawCity && CITY_VALUES.has(rawCity as City) ? (rawCity as City) : null;
  const discipline =
    rawDiscipline && DISCIPLINE_VALUES.has(rawDiscipline as Discipline)
      ? (rawDiscipline as Discipline)
      : null;
  const availableOnly = available === '1';

  const t = await getTranslations('discover');
  const creators = await listCreators({
    city: city ?? undefined,
    discipline: discipline ?? undefined,
    available: availableOnly || undefined,
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-8xl px-6 pb-22 pt-10 md:px-10 md:pt-14">
        {/* Lightweight utility header — single h1, count inline on the right.
            Matches the AdPlist/Contra explore pattern. */}
        <header className="mb-6 flex items-end justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t('title')}
          </h1>
          <span className="shrink-0 text-sm text-surface/50">
            {t('count', { count: creators.length })}
          </span>
        </header>

        <Suspense>
          <FilterBar city={city} discipline={discipline} availableOnly={availableOnly} />
        </Suspense>

        {creators.length === 0 ? (
          <div className="mt-10 rounded-xl border border-surface/10 bg-surface/[0.03] p-10 text-center">
            <p className="text-lg text-surface/70">{t('empty')}</p>
            <p className="mt-2 text-sm text-surface/40">{t('emptyHint')}</p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {creators.map((creator) => (
              <li key={creator.id}>
                <CreatorCard creator={creator} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
