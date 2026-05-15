import { Suspense } from 'react';

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SpaceCard } from '@/components/spaces/space-card';
import { SpaceFilterBar } from '@/components/spaces/space-filter-bar';
import { type Locale } from '@/i18n/config';
import type { SpaceCity } from '@/lib/spaces/mock-data';
import { listActiveSpaces } from '@/lib/spaces/queries';
import { IS_STATIC_EXPORT } from '@/lib/static-export';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ city?: string; minCapacity?: string }>;
}

const CITY_VALUES = new Set<SpaceCity>([
  'RIYADH', 'JEDDAH', 'DAMMAM', 'KHOBAR', 'MAKKAH', 'MEDINA', 'TABUK', 'ABHA',
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'spaces.public' });
  return { title: t('title') };
}

export default async function PublicSpacesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Skip searchParams in static export — Next would otherwise mark this page
  // dynamic and refuse the export. Filters work on the live build only.
  const sp = IS_STATIC_EXPORT ? {} : await searchParams;
  const { city: rawCity, minCapacity: rawMinCapacity } = sp;

  const city = rawCity && CITY_VALUES.has(rawCity as SpaceCity) ? (rawCity as SpaceCity) : null;
  const minCapacityNum = rawMinCapacity ? Number(rawMinCapacity) : NaN;
  const minCapacity =
    Number.isFinite(minCapacityNum) && minCapacityNum > 0 ? Math.floor(minCapacityNum) : null;

  const t = await getTranslations('spaces.public');
  const spaces = await listActiveSpaces({
    city: city ?? undefined,
    minCapacity: minCapacity ?? undefined,
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-8xl px-6 pb-22 pt-10 md:px-10 md:pt-14">
        <header className="mb-6 flex flex-col gap-3">
          <div className="flex items-end justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('title')}</h1>
            <span className="shrink-0 text-sm text-surface/50">
              {t('count', { count: spaces.length })}
            </span>
          </div>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
        </header>

        <div className="mb-8">
          <Suspense>
            <SpaceFilterBar city={city} minCapacity={minCapacity} />
          </Suspense>
        </div>

        {spaces.length === 0 ? (
          <div className="mt-10 rounded-xl border border-surface/10 bg-surface/[0.03] p-10 text-center">
            <p className="text-lg text-surface/70">{t('empty')}</p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {spaces.map((s) => (
              <li key={s.id}>
                <SpaceCard space={s} href={`/${locale}/spaces/${s.id}`} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
