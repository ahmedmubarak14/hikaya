import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { findUserById } from '@/lib/auth/mock-store';
import { getSession } from '@/lib/auth/session';
import { formatDate, formatSarFromHalalas } from '@/lib/format';
import type { BookingStatus } from '@/lib/spaces/mock-data';
import { listBookingsForOwner, listSpacesByOwner } from '@/lib/spaces/queries';
import { getSpaceById } from '@/lib/spaces/mock-store';

import type { Metadata } from 'next';

import { DemoModeNotice } from '@/components/demo-mode-notice';
import { IS_STATIC_EXPORT } from '@/lib/static-export';

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

export default async function MySpaceBookingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/space-bookings`);

  const t = await getTranslations('spaces.bookings');
  const tStatus = await getTranslations('spaces.bookings.status');

  // Resolve space + renter names eagerly — small N, fine to do in a loop.
  const bookings = await listBookingsForOwner(session.user.id);
  // Trigger the load so revalidatePath behaves predictably even when empty.
  await listSpacesByOwner(session.user.id);

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
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-5xl px-6 md:px-10">
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
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {t('title')}
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

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
                      <Badge tone={STATUS_TONE[booking.status]}>
                        {tStatus(booking.status as 'PENDING')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
