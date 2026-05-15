import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { DisciplineTag } from '@/components/creators/discipline-tag';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import type { City } from '@/lib/creators/mock-data';
import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { getAllStudios } from '@/lib/studio/profile';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ city?: string }>;
}

const CITY_VALUES = new Set<City>([
  'RIYADH', 'JEDDAH', 'DAMMAM', 'KHOBAR', 'MAKKAH', 'MEDINA', 'TABUK', 'ABHA',
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'studios' });
  return { title: t('title') };
}

export default async function StudiosPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Filters would mark this dynamic and break static export. Skip in EXPORT.
  const sp = IS_STATIC_EXPORT ? {} : await searchParams;
  const rawCity = sp.city;
  const city = rawCity && CITY_VALUES.has(rawCity as City) ? (rawCity as City) : null;

  const t = await getTranslations('studios');
  const tCity = await getTranslations('cities');

  let studios = getAllStudios();
  if (city) studios = studios.filter((s) => s.city === city);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-8xl px-6 pb-22 pt-10 md:px-10 md:pt-14">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Badge tone="accent" className="self-start">{t('eyebrow')}</Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              {t('headline')}
            </h1>
          </div>
          <span className="shrink-0 text-sm text-surface/50">
            {t('count', { count: studios.length })}
          </span>
        </header>

        {/* City filter — read-only in static export */}
        {!IS_STATIC_EXPORT ? (
          <form className="mb-8 flex flex-wrap items-center gap-2" method="GET">
            <label className="text-sm text-surface/60">{t('filterCity')}</label>
            <select
              name="city"
              defaultValue={city ?? ''}
              className="rounded-md border border-surface/15 bg-bg px-3 py-1.5 text-sm text-surface"
            >
              <option value="">{t('filterAllCities')}</option>
              {Array.from(CITY_VALUES).map((c) => (
                <option key={c} value={c}>
                  {tCity(c as 'RIYADH')}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full border border-surface/15 px-3 py-1.5 text-xs text-surface/70 transition-colors hover:border-surface/40 hover:text-surface"
            >
              {t('filterApply')}
            </button>
          </form>
        ) : null}

        {studios.length === 0 ? (
          <p className="py-20 text-center text-surface/50">{t('empty')}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {studios.map((studio) => {
              const name = locale === 'ar' && studio.nameAr ? studio.nameAr : studio.nameEn;
              return (
                <li key={studio.id}>
                  <Link
                    href={`/${locale}/studios/${studio.slug}`}
                    className="group flex flex-col gap-3"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface/5">
                      {studio.coverUrl ? (
                        <Image
                          src={studio.coverUrl}
                          alt={`${name} — cover`}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-surface/30">
                          —
                        </div>
                      )}
                      {studio.logoUrl ? (
                        <div className="absolute bottom-3 left-3 h-12 w-12 overflow-hidden rounded-full border border-bg/40 bg-bg shadow-md">
                          <Image
                            src={studio.logoUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="truncate text-base font-semibold group-hover:underline underline-offset-2">
                          {name}
                        </h3>
                        <span className="shrink-0 text-xs text-surface/50">
                          {tCity(studio.city as 'RIYADH')}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {studio.specializations.slice(0, 3).map((d) => (
                          <DisciplineTag key={d} discipline={d} tone="neutral" />
                        ))}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
