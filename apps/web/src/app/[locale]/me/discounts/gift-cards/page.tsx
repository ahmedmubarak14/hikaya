import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/me/empty-state';
import { PageHeader } from '@/components/me/page-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'discounts' });
  return { title: `${t('tabs.giftCards')} · ${t('title')}` };
}

export default async function GiftCardsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/discounts/gift-cards`);

  const t = await getTranslations('discounts');
  const tLinks = await getTranslations('me.links');

  const tabs = [
    { href: `/${locale}/me/discounts`, label: t('tabs.coupons') },
    { href: `/${locale}/me/discounts/gift-cards`, label: t('tabs.giftCards') },
  ];

  return (
    <>
      <PageHeader title={tLinks('discounts')} tabs={tabs} />
      <div className="px-8 pb-10">
        <EmptyState
          title={t('giftCards.emptyTitle')}
          body={t('giftCards.emptyBody')}
          secondaryCta={{ href: `/${locale}/me/discounts`, label: t('giftCards.backToCoupons') }}
        />
      </div>
    </>
  );
}
