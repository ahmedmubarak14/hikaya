import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { BookingCalendar } from '@/components/studio/booking-calendar';
import { StatTile } from '@/components/studio/stat-tile';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import {
  computeStudioStats,
  STUDIO_BOOKINGS,
  STUDIO_CLIENTS,
  type BookingStatus,
} from '@/lib/studio/mock-data';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'studio' });
  return { title: t('title') };
}

const STATUS_TONE: Record<
  BookingStatus,
  'neutral' | 'accent' | 'sage' | 'warning' | 'info' | 'purple'
> = {
  INQUIRY: 'neutral',
  QUOTED: 'info',
  CONTRACTED: 'purple',
  CONFIRMED: 'sage',
  IN_PROGRESS: 'accent',
  DELIVERED: 'accent',
  COMPLETED: 'neutral',
  CANCELLED: 'warning',
};

export default async function StudioDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/studio`);

  const t = await getTranslations('studio');
  const tDiscipline = await getTranslations('disciplines');
  const tCity = await getTranslations('cities');

  const stats = computeStudioStats();

  const fmtSar = (sar: number): string =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(sar);

  const fmtNum = (n: number): string =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA').format(n);

  return (
    <>
      <SiteHeader />
      <main className="max-w-8xl py-22 mx-auto w-full px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="text-accent-secondary font-bold">{t('headlineItalic')}</span>
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        {/* Stats */}
        <section className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile
            tone="accent"
            label={t('stats.monthRevenue')}
            value={fmtSar(stats.monthRevenueSar)}
            hint={t('stats.monthRevenueHint')}
          />
          <StatTile
            label={t('stats.monthBookings')}
            value={fmtNum(stats.monthBookings)}
            hint={t('stats.monthBookingsHint')}
          />
          <StatTile
            label={t('stats.outstanding')}
            value={fmtSar(stats.outstandingSar)}
            hint={t('stats.outstandingHint')}
          />
          <StatTile
            label={t('stats.activeClients')}
            value={fmtNum(STUDIO_CLIENTS.length)}
            hint={t('stats.activeClientsHint')}
          />
        </section>

        {/* Calendar + upcoming */}
        <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <BookingCalendar bookings={STUDIO_BOOKINGS} />

          <aside className="border-surface/10 bg-surface/[0.03] flex flex-col gap-4 rounded-xl border p-6">
            <header className="flex items-baseline justify-between">
              <h3 className="text-surface text-2xl">{t('upcoming.title')}</h3>
              <span className="text-2xs text-surface/40">{t('upcoming.window')}</span>
            </header>

            {stats.upcomingNext14d.length === 0 ? (
              <p className="text-surface/50 text-sm">{t('upcoming.empty')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {stats.upcomingNext14d.map((b) => {
                  const d = new Date(b.sessionStart);
                  return (
                    <li key={b.id}>
                      <Card>
                        <CardBody className="flex flex-col gap-1.5 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-surface text-base">{b.clientName}</span>
                            <Badge tone={STATUS_TONE[b.status]}>
                              {t(`status.${b.status}` as 'status.CONFIRMED')}
                            </Badge>
                          </div>
                          <p className="text-2xs text-surface/40">
                            {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            }).format(d)}
                            {' · '}
                            {tDiscipline(disciplineKey(b.discipline) as 'weddingPhoto')}
                            {' · '}
                            {tCity(b.city as 'RIYADH')}
                          </p>
                        </CardBody>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </section>

        {/* Clients */}
        <section className="border-surface/10 bg-surface/[0.03] overflow-hidden rounded-xl border">
          <header className="flex items-baseline justify-between p-6">
            <h3 className="text-surface text-2xl">{t('clients.title')}</h3>
            <span className="text-2xs text-surface/40">
              {t('clients.count', { count: STUDIO_CLIENTS.length })}
            </span>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="border-surface/10 bg-surface/[0.02] border-y">
                <tr className="text-2xs text-surface/40 text-start">
                  <Th>{t('clients.name')}</Th>
                  <Th>{t('clients.tags')}</Th>
                  <Th align="end">{t('clients.bookings')}</Th>
                  <Th align="end">{t('clients.totalSpend')}</Th>
                  <Th align="end">{t('clients.lastSession')}</Th>
                </tr>
              </thead>
              <tbody>
                {STUDIO_CLIENTS.slice()
                  .sort((a, b) => b.totalSpendSar - a.totalSpendSar)
                  .map((c) => (
                    <tr key={c.id} className="border-surface/5 border-b last:border-0">
                      <Td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-surface text-base">{c.name}</span>
                          <span className="text-2xs text-surface/40 font-mono">{c.email}</span>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1.5">
                          {c.isBusiness ? <Badge tone="info">{t('clients.business')}</Badge> : null}
                          {c.tags.map((tag) => (
                            <Badge key={tag} tone="neutral">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </Td>
                      <Td align="end">{fmtNum(c.bookingsCount)}</Td>
                      <Td align="end">{fmtSar(c.totalSpendSar)}</Td>
                      <Td align="end">
                        {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }).format(new Date(c.lastBookingAt))}
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-2xs text-surface/30 mt-10 max-w-prose">{t('mockNote')}</p>
      </main>
    </>
  );
}

function Th({ children, align = 'start' }: { children: React.ReactNode; align?: 'start' | 'end' }) {
  return (
    <th className={align === 'end' ? 'p-4 text-end' : 'p-4 text-start'} scope="col">
      {children}
    </th>
  );
}

function Td({ children, align = 'start' }: { children: React.ReactNode; align?: 'start' | 'end' }) {
  return <td className={align === 'end' ? 'p-4 text-end' : 'p-4 text-start'}>{children}</td>;
}

const DISCIPLINE_KEYS_REVERSE: Record<string, string> = {
  WEDDING_PHOTOGRAPHY: 'weddingPhoto',
  PORTRAIT_PHOTOGRAPHY: 'portraitPhoto',
  COMMERCIAL_PHOTOGRAPHY: 'commercialPhoto',
  PRODUCT_PHOTOGRAPHY: 'productPhoto',
  EVENT_PHOTOGRAPHY: 'eventPhoto',
  FASHION_PHOTOGRAPHY: 'fashionPhoto',
  COMMERCIAL_VIDEO: 'commercialVideo',
  WEDDING_VIDEO: 'weddingVideo',
  EVENT_VIDEO: 'eventVideo',
  DOCUMENTARY: 'documentary',
  GRAPHIC_DESIGN: 'graphicDesign',
  BRAND_IDENTITY: 'brandIdentity',
  MOTION_GRAPHICS: 'motionGraphics',
  VIDEO_EDITING: 'videoEditing',
  COLOR_GRADING: 'colorGrading',
  RETOUCHING: 'retouching',
  DRONE_OPERATION: 'drone',
};

function disciplineKey(d: string): string {
  return DISCIPLINE_KEYS_REVERSE[d] ?? 'commercialPhoto';
}
