import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { StatTile } from '@/components/studio/stat-tile';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getCreatorAnalyticsAction } from '@/lib/analytics/actions';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'analytics' });
  return { title: t('title') };
}

export default async function AnalyticsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const t = await getTranslations('analytics');
  const analytics = await getCreatorAnalyticsAction();

  const formatSar = (halalas: number) => `SAR ${(halalas / 100).toLocaleString()}`;

  return (
    <>
      <main className="py-22 mx-auto w-full max-w-4xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-surface/50 hover:text-surface/70 text-sm transition-colors"
          >
            {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">{t('eyebrow')}</Badge>
          <h1 className="text-balance text-5xl">{t('title')}</h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        {!analytics ? (
          <Card>
            <CardBody className="p-8 text-center">
              <p className="text-surface/60">{t('noProfile')}</p>
              <p className="text-surface/40 mt-2 text-sm">{t('noProfileHint')}</p>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Key metrics */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
              <StatTile
                label={t('profileViews')}
                value={String(analytics.profileViews)}
                tone="accent"
              />
              <StatTile
                label={t('portfolioViews')}
                value={String(analytics.portfolioViews)}
              />
              <StatTile
                label={t('totalBookings')}
                value={String(analytics.totalBookings)}
              />
              <StatTile
                label={t('totalRevenue')}
                value={formatSar(analytics.totalRevenueHalalas)}
                tone="accent"
              />
              <StatTile
                label={t('inquiries')}
                value={String(analytics.inquiryCount)}
              />
              <StatTile
                label={t('conversionRate')}
                value={`${analytics.conversionRate}%`}
                hint={t('conversionRateHint', {
                  approved: analytics.quotesApproved,
                  total: analytics.quotesTotal,
                })}
              />
            </div>

            {/* Simple CSS bar chart for quotes */}
            <section className="mb-8">
              <h2 className="text-surface mb-4 text-xl font-semibold">{t('quotesOverview')}</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-surface/60 w-28 text-sm">{t('quotesTotal')}</span>
                  <div className="flex-1">
                    <div
                      className="bg-surface/20 h-6 rounded"
                      style={{ width: `${Math.max(analytics.quotesTotal * 10, 4)}%`, maxWidth: '100%' }}
                    />
                  </div>
                  <span className="text-surface w-8 text-right text-sm font-medium">
                    {analytics.quotesTotal}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-surface/60 w-28 text-sm">{t('quotesApproved')}</span>
                  <div className="flex-1">
                    <div
                      className="bg-accent/40 h-6 rounded"
                      style={{ width: `${Math.max(analytics.quotesApproved * 10, 4)}%`, maxWidth: '100%' }}
                    />
                  </div>
                  <span className="text-surface w-8 text-right text-sm font-medium">
                    {analytics.quotesApproved}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
