import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { ConfirmBookingButton } from '@/components/spaces/confirm-booking-button';
import { type Locale } from '@/i18n/config';
import { findUserById } from '@/lib/auth/mock-store';
import { getSession } from '@/lib/auth/session';
import { formatDate, formatSarFromHalalas } from '@/lib/format';
import type { BookingStatus, SpaceBooking } from '@/lib/spaces/mock-data';
import { listBookingsForOwner, listSpacesByOwner } from '@/lib/spaces/queries';
import { getSpaceById } from '@/lib/spaces/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'spaces.bookings' });
  return { title: t('title') };
}

const STATUS_TONE: Record<BookingStatus, 'neutral' | 'sage' | 'warning' | 'accent'> = {
  PENDING: 'accent',
  CONFIRMED: 'sage',
  CANCELLED: 'warning',
  COMPLETED: 'neutral',
};

/**
 * Compute host metrics from the host's bookings:
 *   - Total realised revenue (CONFIRMED + COMPLETED)
 *   - Occupancy % over the trailing 30 days (booked days / total available days
 *     across the host's published spaces). Cancelled bookings excluded.
 *   - Counts per status.
 */
function computeHostStats(
  bookings: SpaceBooking[],
  publishedSpaceCount: number,
): {
  revenueHalalas: number;
  occupancyPercent: number;
  pending: number;
  confirmed: number;
  completed: number;
} {
  const now = Date.now();
  const windowStart = now - 30 * 24 * 60 * 60 * 1000;

  let revenue = 0;
  let bookedMs = 0;
  let pending = 0;
  let confirmed = 0;
  let completed = 0;

  for (const b of bookings) {
    if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') revenue += b.totalHalalas;
    if (b.status === 'PENDING') pending++;
    if (b.status === 'CONFIRMED') confirmed++;
    if (b.status === 'COMPLETED') completed++;

    // Occupancy only counts non-cancelled bookings overlapping the window.
    if (b.status === 'CANCELLED') continue;
    const start = Math.max(Date.parse(b.startISO), windowStart);
    const end = Math.min(Date.parse(b.endISO), now);
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      bookedMs += end - start;
    }
  }

  const totalAvailableMs =
    Math.max(1, publishedSpaceCount) * 30 * 24 * 60 * 60 * 1000;
  const occupancyPercent = Math.min(
    100,
    Math.round((bookedMs / totalAvailableMs) * 100),
  );

  return { revenueHalalas: revenue, occupancyPercent, pending, confirmed, completed };
}

export default async function MySpaceBookingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/space-bookings`);

  const t = await getTranslations('spaces.bookings');
  const tStatus = await getTranslations('spaces.bookings.status');

  const bookings = await listBookingsForOwner(session.user.id);
  const ownedSpaces = await listSpacesByOwner(session.user.id);
  const publishedCount = ownedSpaces.filter((s) => s.status === 'ACTIVE').length;
  const stats = computeHostStats(bookings, publishedCount);

  const rows = bookings.map((b) => {
    const space = getSpaceById(b.spaceId);
    const renter = findUserById(b.renterId);
    return {
      booking: b,
      spaceName: space?.name ?? '—',
      renterName: renter?.displayName ?? b.renterId,
    };
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      <header className="mb-10 flex flex-col gap-3">
        <Link
          href={`/${locale}/me`}
          className="text-2xs text-surface/40 hover:text-surface transition-colors"
        >
          ← {t('back')}
        </Link>
        <Badge tone="accent" className="self-start">
          {t('eyebrow')}
        </Badge>
        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">{t('title')}</h1>
        <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
      </header>

      {/* Host stats */}
      <section className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t('stats.revenue')}
          value={formatSarFromHalalas(stats.revenueHalalas, locale)}
        />
        <StatTile
          label={t('stats.occupancy')}
          value={publishedCount > 0 ? `${stats.occupancyPercent}%` : '—'}
          hint={publishedCount > 0 ? t('stats.occupancyHint') : t('stats.noSpaces')}
        />
        <StatTile label={t('stats.pending')} value={String(stats.pending)} />
        <StatTile label={t('stats.completed')} value={String(stats.completed)} />
      </section>

      {rows.length === 0 ? (
        <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
          <p className="text-surface/70 text-lg">{t('empty')}</p>
          <p className="text-surface/40 mt-2 text-sm">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="border-surface/10 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-surface/[0.04] text-2xs text-surface/50 uppercase">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('colSpace')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('colRenter')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('colDates')}</th>
                <th className="px-4 py-3 text-end font-medium">{t('colTotal')}</th>
                <th className="px-4 py-3 text-end font-medium">{t('colStatus')}</th>
                <th className="px-4 py-3 text-end font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ booking, spaceName, renterName }) => (
                <tr key={booking.id} className="border-surface/10 border-t">
                  <td className="text-surface px-4 py-3">{spaceName}</td>
                  <td className="text-surface/70 px-4 py-3">{renterName}</td>
                  <td className="text-2xs text-surface/70 px-4 py-3 font-mono tabular-nums">
                    {formatDate(booking.startISO, locale)} → {formatDate(booking.endISO, locale)}
                  </td>
                  <td className="text-surface px-4 py-3 text-end font-mono tabular-nums">
                    {formatSarFromHalalas(booking.totalHalalas, locale)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Badge tone={STATUS_TONE[booking.status]}>{tStatus(booking.status)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-end">
                    {booking.status === 'PENDING' ? (
                      <ConfirmBookingButton locale={locale} bookingId={booking.id} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-line/60 bg-paper rounded-xl border p-5">
      <p className="text-muted text-xs uppercase tracking-wider">{label}</p>
      <p className="text-surface mt-2 font-mono text-2xl tabular-nums">{value}</p>
      {hint ? <p className="text-muted mt-1 text-2xs">{hint}</p> : null}
    </div>
  );
}
