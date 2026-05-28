import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { type ReactNode } from 'react';

import { MeSidebar } from '@/components/me/sidebar';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';

interface Props {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}

function profileCompletion(creator: Awaited<ReturnType<typeof getMyCreatorProfile>>): number {
  if (!creator) return 11;
  let score = 20;
  if (creator.username) score += 15;
  if (creator.bioEn || creator.bioAr) score += 15;
  if (creator.avatarUrl) score += 15;
  if (creator.city) score += 10;
  if (creator.disciplines && creator.disciplines.length > 0) score += 15;
  if (creator.startingPriceSar) score += 10;
  return Math.min(100, score);
}

export default async function MeLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const t = await getTranslations({ locale, namespace: 'me' });
  const tLinks = await getTranslations({ locale, namespace: 'me.links' });

  const creator = await getMyCreatorProfile(session.user.email);
  const completion = profileCompletion(creator);

  const labels = {
    completeProfile: t('sidebar.completeProfile'),
    create: t('sidebar.create'),
    home: t('sidebar.home'),
    profile: tLinks('portfolio'),
    inquiries: tLinks('inquiries'),
    messages: t('sidebar.messages'),
    wallet: t('sidebar.wallet'),
    payments: t('sidebar.payments'),
    discover: t('sidebar.discover'),
    jobs: tLinks('jobs'),
    portfolio: tLinks('portfolio'),
    studio: tLinks('studio'),
    quotes: tLinks('quotes'),
    contracts: tLinks('contracts'),
    purchases: tLinks('purchases'),
    discounts: tLinks('discounts'),
    people: t('sidebar.people'),
    studios: t('sidebar.studios'),
    services: tLinks('services'),
    promoTitle: t('sidebar.promoTitle'),
    promoCta: t('sidebar.promoCta'),
  };

  return (
    <div className="bg-bg flex min-h-screen">
      <MeSidebar
        locale={locale}
        user={{
          displayName: session.user.displayName,
          avatarUrl: session.user.avatarUrl ?? null,
        }}
        workspaceLabel={t('sidebar.workspace')}
        completionPercent={completion}
        labels={labels}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
