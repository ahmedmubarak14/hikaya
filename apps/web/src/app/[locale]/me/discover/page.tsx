import { redirect } from 'next/navigation';

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CreatorCardWithFavorite } from '@/components/creators/creator-card-with-favorite';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { listCreators } from '@/lib/creators/queries';
import { getFavoriteStatus } from '@/lib/creators/actions';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'discover' });
  return { title: t('title') };
}

export default async function MeDiscoverPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/discover`);

  const t = await getTranslations('discover');
  const creators = await listCreators({});

  const creatorIds = creators.map((c) => c.id);
  const favoriteStatus = creatorIds.length > 0 ? await getFavoriteStatus(creatorIds) : {};

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <header className="mb-8">
        <h1 className="text-surface text-3xl font-semibold tracking-tight">{t('heroTitle')}</h1>
        <p className="text-muted mt-2 text-sm">{t('emptySubtitle')}</p>
      </header>

      {creators.length === 0 ? (
        <div className="border-line/60 rounded-2xl border bg-paper p-10 text-center">
          <p className="text-surface text-lg font-medium">{t('empty')}</p>
          <p className="text-muted mt-2 text-sm">{t('emptySubtitle')}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    </div>
  );
}
