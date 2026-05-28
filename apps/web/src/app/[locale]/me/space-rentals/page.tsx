import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { formatDate, formatSarFromHalalas } from '@/lib/format';
import type { BookingStatus } from '@/lib/spaces/mock-data';
import { listBookingsByRenter } from '@/lib/spaces/queries';
import { getSpaceById } from '@/lib/spaces/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'spaces.rentals' });
  return { title: t('title') };
}

const STATUS_TONE: Record<BookingStatus, 'neutral' | 'sage' | 'warning' | 'accent'> = {
  PENDING: 'accent',
  CONFIRMED: 'sage',
  CANCELLED: 'warning',
  COMPLETED: 'neutral',
};

export default async function MySpaceRentalsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/space-rentals`);

  const t = await getTranslations('spaces.rentals');
  const tStatus = await getTranslations('spaces.bookings.status');

  const bookings = await listBookingsByRenter(session.user.id);
  const rows = bookings.map((b) => ({
    booking: b,
    space: getSpaceById(b.spaceId),
  }));

  return (
    <>
      <main className="py-22 mx-auto w-full max-w-4xl px-6 md:px-10">
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
            <div className="mt-4 flex justify-center">
              <Link href={`/${locale}/spaces`}>
                <Button size="md" variant="primary">
                  {t('browse')}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map(({ booking, space }) => (
              <li key={booking.id}>
                <Link
                  href={`/${locale}/me/space-rentals/${booking.id}`}
                  className="border-surface/10 bg-surface/[0.03] hover:border-surface/30 block rounded-xl border p-4 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-surface text-base">{space?.name ?? '—'}</span>
                    <Badge tone={STATUS_TONE[booking.status]}>{tStatus(booking.status)}</Badge>
                  </div>
                  <p className="text-2xs text-surface/60 mt-1 font-mono tabular-nums">
                    {formatDate(booking.startISO, locale)} → {formatDate(booking.endISO, locale)}
                  </p>
                  <p className="text-surface mt-1 font-mono text-sm tabular-nums">
                    {formatSarFromHalalas(booking.totalHalalas, locale)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
