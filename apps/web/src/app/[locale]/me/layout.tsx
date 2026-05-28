import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { type ReactNode } from 'react';

import { MeSidebar } from '@/components/me/sidebar';
import { MeTopbar } from '@/components/me/topbar';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';

interface Props {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}

export default async function MeLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const t = await getTranslations({ locale, namespace: 'me.links' });
  const tNav = await getTranslations({ locale, namespace: 'me.nav' });
  const tShared = await getTranslations({ locale, namespace: 'me' });

  const labels = {
    home: tShared('sidebar.home'),
    portfolio: t('portfolio'),
    inquiries: t('inquiries'),
    messages: tShared('sidebar.messages'),
    tools: tNav('business'),
    blog: t('blog'),
    store: t('store'),
    galleries: t('galleries'),
    studio: t('studio'),
    services: t('services'),
    jobs: t('jobs'),
    quotes: t('quotes'),
    contracts: t('contracts'),
    templates: t('templates'),
    spaces: t('spaces'),
    availability: t('availability'),
    discounts: t('discounts'),
    settings: t('settings'),
    analytics: t('analytics'),
    favorites: t('favorites'),
    purchases: t('purchases'),
    disputes: t('disputes'),
  };

  return (
    <div className="bg-bg flex min-h-screen">
      <MeSidebar locale={locale} labels={labels} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MeTopbar
          locale={locale}
          user={{
            displayName: session.user.displayName,
            email: session.user.email,
            avatarUrl: session.user.avatarUrl ?? null,
            username: session.user.username ?? null,
          }}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
