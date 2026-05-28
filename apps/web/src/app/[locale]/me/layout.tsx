import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { type ReactNode } from 'react';

import { MeSidebar } from '@/components/me/sidebar';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import {
  getProfileActionItems,
  getProfileCompletionPercent,
} from '@/lib/me/profile-completion';

interface Props {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}

export default async function MeLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const t = await getTranslations({ locale, namespace: 'me' });
  const tLinks = await getTranslations({ locale, namespace: 'me.links' });
  const tAuth = await getTranslations({ locale, namespace: 'auth' });

  const creator = await getMyCreatorProfile(session.user.email);
  const actionItems = getProfileActionItems(creator, locale);
  const completion = getProfileCompletionPercent(actionItems);

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
    create_post: t('sidebar.createPost'),
    create_project: t('sidebar.createProject'),
    create_product: t('sidebar.createProduct'),
    create_service: t('sidebar.createService'),
    create_paymentLink: t('sidebar.createPaymentLink'),
    create_invoice: t('sidebar.createInvoice'),
    ws_dashboard: t('sidebar.wsDashboard'),
    ws_analytics: t('sidebar.wsAnalytics'),
    ws_network: t('sidebar.wsNetwork'),
    ws_portfolio: t('sidebar.wsPortfolio'),
    ws_settings: t('sidebar.wsSettings'),
    ws_switchWorkspace: t('sidebar.wsSwitchWorkspace'),
    ws_help: t('sidebar.wsHelp'),
    ws_logOut: t('sidebar.wsLogOut'),
    ws_roleCreator: tAuth('roleCreator'),
    ws_roleStudioOwner: tAuth('roleStudioOwner'),
    ws_roleClient: tAuth('roleClient'),
    ws_addWorkspace: t('sidebar.wsAddWorkspace'),
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
        currentRole={session.user.currentRole}
        availableRoles={session.user.roles}
        completionPercent={completion}
        labels={labels}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
