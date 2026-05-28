import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CreatorCardWithFavorite } from '@/components/creators/creator-card-with-favorite';
import { DiscoverHero } from '@/components/creators/discover-hero';
import { DiscoverViewSwitcher } from '@/components/creators/discover-view-switcher';
import { FilterBar } from '@/components/creators/filter-bar';
import { ProjectsGrid } from '@/components/creators/projects-grid';
import { type DiscoverView } from '@/components/creators/view-toggle';
import { EmptyState } from '@/components/empty-state';
import { SaveSearchButton } from '@/components/favorites/save-search-button';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import type { City, Discipline } from '@/lib/creators/mock-data';
import { listCreators } from '@/lib/creators/queries';
import { getFavoriteStatus } from '@/lib/creators/actions';
import { IS_STATIC_EXPORT } from '@/lib/static-export';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    city?: string;
    discipline?: string;
    available?: string;
    view?: string;
  }>;
}

const CITY_VALUES = new Set<City>([
  'RIYADH',
  'JEDDAH',
  'DAMMAM',
  'KHOBAR',
  'MAKKAH',
  'MEDINA',
  'TABUK',
  'ABHA',
]);

const DISCIPLINE_VALUES = new Set<Discipline>([
  'WEDDING_PHOTOGRAPHY',
  'PORTRAIT_PHOTOGRAPHY',
  'COMMERCIAL_PHOTOGRAPHY',
  'PRODUCT_PHOTOGRAPHY',
  'EVENT_PHOTOGRAPHY',
  'FASHION_PHOTOGRAPHY',
  'COMMERCIAL_VIDEO',
  'WEDDING_VIDEO',
  'EVENT_VIDEO',
  'DOCUMENTARY',
  'GRAPHIC_DESIGN',
  'BRAND_IDENTITY',
  'MOTION_GRAPHICS',
  'VIDEO_EDITING',
  'COLOR_GRADING',
  'RETOUCHING',
  'DRONE_OPERATION',
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'discover' });
  return { title: t('title') };
}

export default async function MeDiscoverPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/discover`);

  const sp = IS_STATIC_EXPORT ? {} : await searchParams;
  const { city: rawCity, discipline: rawDiscipline, available, view: rawView } = sp;

  const city = rawCity && CITY_VALUES.has(rawCity as City) ? (rawCity as City) : null;
  const discipline =
    rawDiscipline && DISCIPLINE_VALUES.has(rawDiscipline as Discipline)
      ? (rawDiscipline as Discipline)
      : null;
  const availableOnly = available === '1';
  const view: DiscoverView = rawView === 'projects' ? 'projects' : 'people';

  const t = await getTranslations('discover');
  const creators = await listCreators({
    city: city ?? undefined,
    discipline: discipline ?? undefined,
    available: availableOnly || undefined,
  });

  const creatorIds = creators.map((c) => c.id);
  const favoriteStatus = creatorIds.length > 0 ? await getFavoriteStatus(creatorIds) : {};

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <DiscoverHero
        title={t('heroTitle')}
        placeholder={t('searchPlaceholder')}
        searchLabel={t('searchAction')}
      />

      <Suspense>
        <DiscoverViewSwitcher
          initial={view}
          labels={{ projects: t('viewProjects'), people: t('viewPeople') }}
          peopleNode={
            <>
              <Suspense>
                <FilterBar city={city} discipline={discipline} availableOnly={availableOnly} />
              </Suspense>
              <div className="mt-4 flex items-center justify-between">
                <div />
                <Suspense>
                  <SaveSearchButton />
                </Suspense>
              </div>
              {creators.length === 0 ? (
                <EmptyState
                  title={t('empty')}
                  subtitle={t('emptySubtitle')}
                  ctaLabel={t('emptyCta')}
                  ctaHref={`/${locale}/sign-up`}
                  icon={'\u{1F50D}'}
                />
              ) : (
                <ul className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                  {creators.map((creator) => (
                    <li key={creator.id}>
                      <CreatorCardWithFavorite
                        creator={creator}
                        isFavorited={favoriteStatus[creator.id] ?? false}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          }
          projectsNode={
            <ProjectsGrid locale={locale} creators={creators} emptyLabel={t('empty')} />
          }
        />
      </Suspense>
    </div>
  );
}
