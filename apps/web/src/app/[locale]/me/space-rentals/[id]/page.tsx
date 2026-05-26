import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { CancelBookingButton } from '@/components/spaces/cancel-booking-button';
import { CheckInOutPanel } from '@/components/spaces/check-in-out-panel';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { formatDateTime, formatSarFromHalalas } from '@/lib/format';
import type { BookingStatus } from '@/lib/spaces/mock-data';
import { getBooking, getSpace } from '@/lib/spaces/queries';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  const { getBookingsByRenter } = await import('@/lib/spaces/mock-store');
  const items = getBookingsByRenter('u_noor_demo');
  return locales.flatMap((locale) => {
    const real = items.map((item) => ({ locale, id: item.id }));
    // Always include a `_demo` placeholder so Next has a path to render
    // even when no items have been seeded for this entity.
    return real.length > 0 ? real : [{ locale, id: '_demo' }];
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'spaces.rentals.detail' });
  return { title: t('title', { name: '—' }) };
}

const STATUS_TONE: Record<BookingStatus, 'neutral' | 'sage' | 'warning' | 'accent'> = {
  PENDING: 'accent',
  CONFIRMED: 'sage',
  CANCELLED: 'warning',
  COMPLETED: 'neutral',
};

export default async function SpaceRentalDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/space-rentals/${id}`);

  const booking = await getBooking(id);
  if (!booking || booking.renterId !== session.user.id) notFound();

  const space = await getSpace(booking.spaceId);
  const t = await getTranslations('spaces.rentals');
  const tDetail = await getTranslations('spaces.rentals.detail');
  const tStatus = await getTranslations('spaces.bookings.status');

  const canCancel = booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED';

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-3xl px-6 md:px-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/space-rentals`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {tDetail('back')}
          </Link>
          <h1 className="text-balance text-4xl">
            {tDetail('title', { name: space?.name ?? '—' })}
          </h1>
        </header>

        <Card>
          <CardBody className="flex flex-col gap-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone={STATUS_TONE[booking.status]}>{tStatus(booking.status)}</Badge>
              {space ? (
                <Link
                  href={`/${locale}/spaces/${space.id}`}
                  className="text-2xs text-surface/40 hover:text-surface underline-offset-4 hover:underline"
                >
                  {space.name} ↗
                </Link>
              ) : null}
            </div>

            <p className="text-surface/80 font-mono text-sm tabular-nums">
              {tDetail('dates', {
                start: formatDateTime(booking.startISO, locale),
                end: formatDateTime(booking.endISO, locale),
              })}
            </p>

            <div className="border-surface/10 flex items-baseline justify-between gap-3 border-t pt-4">
              <span className="text-2xs text-surface/40">{tDetail('totalLabel')}</span>
              <span className="text-surface font-mono text-2xl tabular-nums">
                {formatSarFromHalalas(booking.totalHalalas, locale)}
              </span>
            </div>

            {/* Access code — shown to renter only during booking window when confirmed */}
            {booking.accessCode && booking.status === 'CONFIRMED' ? (() => {
              const now = Date.now();
              const start = Date.parse(booking.startISO);
              const end = Date.parse(booking.endISO);
              const inWindow = now >= start && now <= end;
              return inWindow ? (
                <div className="border-sage/30 bg-sage/10 rounded-xl border p-5">
                  <span className="text-2xs text-sage">{tDetail('accessCodeLabel')}</span>
                  <p className="text-surface mt-1 font-mono text-3xl font-bold tracking-widest">
                    {booking.accessCode}
                  </p>
                </div>
              ) : (
                <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-4">
                  <p className="text-surface/50 text-sm">{tDetail('accessCodeNotYet')}</p>
                </div>
              );
            })() : null}

            {/* Deposit status */}
            {booking.depositStatus ? (
              <div className="border-surface/10 flex items-baseline justify-between gap-3 border-t pt-4">
                <span className="text-2xs text-surface/40">{tDetail('depositLabel')}</span>
                <Badge tone={booking.depositStatus === 'RELEASED' ? 'sage' : booking.depositStatus === 'CLAIMED' ? 'warning' : 'accent'}>
                  {tDetail(`deposit.${booking.depositStatus}` as 'deposit.HELD')}
                </Badge>
              </div>
            ) : null}

            {/* Smart lock notice */}
            {space?.smartLockConfig && booking.status === 'CONFIRMED' ? (
              <div className="border-sage/30 bg-sage/10 rounded-xl border p-4">
                <p className="text-surface/70 text-sm">{tDetail('smartLockAutoCode')}</p>
              </div>
            ) : null}

            {/* Check-in / Check-out flow */}
            <CheckInOutPanel locale={locale} booking={booking} />

            {canCancel ? (
              <div className="border-surface/10 border-t pt-4">
                <CancelBookingButton locale={locale} bookingId={booking.id} />
              </div>
            ) : null}

            <p className="text-2xs text-surface/40">{t('subtitle')}</p>
          </CardBody>
        </Card>
      </main>
    </>
  );
}
