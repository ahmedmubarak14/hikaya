import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { DiscountManager } from '@/components/discounts/discount-manager';
import { SiteHeader } from '@/components/site-header';
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
  const creator = await getMyCreatorProfile(session.user.email);

  if (!creator) {
    return (
      <>
        <SiteHeader />
        <main className="py-22 mx-auto w-full max-w-3xl px-6 md:px-10">
          <Link
            href={`/${locale}/me`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            {t('backToAccount')}
          </Link>
          <Card className="mt-8">
            <CardBody className="flex flex-col gap-4 p-8">
              <Badge tone="warning" className="self-start">
                {t('clientLabel')}
              </Badge>
              <h1 className="text-balance text-3xl">{t('clientTitle')}</h1>
              <p className="text-surface/60">{t('clientBody')}</p>
            </CardBody>
          </Card>
        </main>
      </>
    );
  }

  // Fetch existing discount codes
  const supabase = await createClient();
  const { data: discounts } = await supabase
    .from('DiscountCode')
    .select('*')
    .eq('ownerUserId', session.user.id)
    .order('createdAt', { ascending: false });

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-5xl px-6 md:px-10">
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

        <DiscountManager
          locale={locale}
          discounts={
            (discounts ?? []).map((d) => ({
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
            }))
          }
        />
      </main>
    </>
  );
}
