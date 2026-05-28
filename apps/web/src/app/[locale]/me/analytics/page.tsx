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
    <div className="mx-auto w-full max-w-4xl px-8 py-10">
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

            {/* Hiring funnel — 4 stages, widest stage scaled to 100%. */}
            <section className="mb-8">
              <h2 className="text-surface mb-4 text-xl font-semibold">{t('funnel.title')}</h2>
              {(() => {
                const peak = Math.max(
                  analytics.funnel.inquiries,
                  analytics.funnel.quotes,
                  analytics.funnel.bookings,
                  analytics.funnel.completed,
                  1,
                );
                const stages: { key: 'inquiries' | 'quotes' | 'bookings' | 'completed'; tone: string }[] = [
                  { key: 'inquiries', tone: 'bg-surface/20' },
                  { key: 'quotes', tone: 'bg-accent-secondary/40' },
                  { key: 'bookings', tone: 'bg-accent/60' },
                  { key: 'completed', tone: 'bg-sage/60' },
                ];
                return (
                  <div className="flex flex-col gap-3">
                    {stages.map(({ key, tone }) => {
                      const value = analytics.funnel[key];
                      const pct = Math.max(4, Math.round((value / peak) * 100));
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-surface/60 w-28 text-sm">{t(`funnel.${key}`)}</span>
                          <div className="flex-1">
                            <div className={`${tone} h-6 rounded`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-surface w-10 text-right text-sm font-medium tabular-nums">
                            {value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>

            {/* Revenue by month — 12-month bar chart. */}
            <section className="mb-8">
              <h2 className="text-surface mb-4 text-xl font-semibold">{t('revenueByMonth.title')}</h2>
              {(() => {
                const series = analytics.revenueByMonth;
                const peak = Math.max(1, ...series.map((p) => p.halalas));
                return (
                  <div className="border-surface/10 bg-surface/[0.02] flex items-end gap-1 rounded-lg border p-4">
                    {series.map((p) => {
                      const pct = Math.max(2, Math.round((p.halalas / peak) * 100));
                      const labelMonth = new Intl.DateTimeFormat(
                        locale === 'ar' ? 'ar-SA' : 'en-SA',
                        { month: 'short' },
                      ).format(new Date(p.monthIso));
                      return (
                        <div
                          key={p.monthIso}
                          className="flex flex-1 flex-col items-center gap-1.5"
                          title={`${labelMonth}: ${formatSar(p.halalas)}`}
                        >
                          <div className="flex h-32 w-full items-end">
                            <div
                              className="bg-accent/60 w-full rounded-t"
                              style={{ height: `${pct}%` }}
                            />
                          </div>
                          <span className="text-2xs text-surface/40">{labelMonth}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>
          </>
        )}
      </div>
  );
}
