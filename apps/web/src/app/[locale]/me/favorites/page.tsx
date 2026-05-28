import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FavoriteCreatorGrid } from '@/components/favorites/favorite-creator-grid';
import { SavedSearchList } from '@/components/favorites/saved-search-list';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyFavorites, getMySavedSearches } from '@/lib/creators/actions';
import { listCreators } from '@/lib/creators/queries';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'favorites' });
  return { title: t('title') };
}

export default async function FavoritesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/favorites`);

  const t = await getTranslations('favorites');
  const [favoriteIds, savedSearches, allCreators] = await Promise.all([
    getMyFavorites(),
    getMySavedSearches(),
    listCreators(),
  ]);

  // Match favorite IDs to creator profiles
  const favoriteCreators = allCreators.filter((c) => favoriteIds.includes(c.id));

  return (
    <>
      <main className="py-22 mx-auto w-full max-w-6xl px-6 md:px-10">
        <header className="mb-12 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            {'← '}{t('backToAccount')}
          </Link>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="text-accent-secondary font-bold">{t('headlineItalic')}</span>
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        {/* Favorite creators */}
        <section className="mb-16">
          <header className="border-surface/10 mb-6 flex flex-col gap-1.5 border-b pb-4">
            <h2 className="text-surface text-3xl">{t('creatorsTitle')}</h2>
            <p className="text-surface/60 text-sm">{t('creatorsSubtitle')}</p>
          </header>

          <FavoriteCreatorGrid creators={favoriteCreators} locale={locale} />
        </section>

        {/* Saved searches */}
        <section>
          <header className="border-surface/10 mb-6 flex flex-col gap-1.5 border-b pb-4">
            <h2 className="text-surface text-3xl">{t('searchesTitle')}</h2>
            <p className="text-surface/60 text-sm">{t('searchesSubtitle')}</p>
          </header>

          <SavedSearchList searches={savedSearches} locale={locale} />
        </section>
      </main>
    </>
  );
}
