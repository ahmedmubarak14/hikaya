import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Badge, Card, CardBody } from '@hikaya/ui';

import { DiscountManager } from '@/components/discounts/discount-manager';
import { PageHeader } from '@/components/me/page-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { createClient } from '@/lib/supabase/server';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'discounts' });
  return { title: t('title') };
}

export default async function DiscountsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/discounts`);

  const t = await getTranslations('discounts');
  const tLinks = await getTranslations('me.links');
  const creator = await getMyCreatorProfile(session.user.email);

  const tabs = [
    { href: `/${locale}/me/discounts`, label: t('tabs.coupons') },
    { href: `/${locale}/me/discounts/gift-cards`, label: t('tabs.giftCards') },
  ];

  if (!creator) {
    return (
      <>
        <PageHeader title={tLinks('discounts')} tabs={tabs} />
        <div className="mx-auto w-full max-w-3xl px-8 pb-10">
          <Card>
            <CardBody className="flex flex-col gap-4 p-8">
              <Badge tone="warning" className="self-start">
                {t('clientLabel')}
              </Badge>
              <h2 className="text-balance text-xl font-semibold">{t('clientTitle')}</h2>
              <p className="text-muted">{t('clientBody')}</p>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const { data: discounts } = await supabase
    .from('DiscountCode')
    .select('*')
    .eq('ownerUserId', session.user.id)
    .order('createdAt', { ascending: false });

  const items = discounts ?? [];

  return (
    <>
      <PageHeader title={tLinks('discounts')} tabs={tabs} />
      <div className="px-8 pb-10">
        <DiscountManager
          locale={locale}
          discounts={items.map((d) => ({
            id: d.id as string,
            code: d.code as string,
            percentageOff: d.percentageOff as number | null,
            amountOffHalalas: d.amountOffHalalas as number | null,
            minOrderHalalas: d.minOrderHalalas as number | null,
            maxUses: d.maxUses as number | null,
            usedCount: d.usedCount as number,
            expiresAt: d.expiresAt as string | null,
            isActive: d.isActive as boolean,
            createdAt: d.createdAt as string,
          }))}
        />
      </div>
    </>
  );
}
