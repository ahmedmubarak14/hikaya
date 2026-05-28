'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { type Locale } from '@/i18n/config';
import { confirmBookingAction } from '@/lib/spaces/actions';

interface Props {
  locale: Locale;
  bookingId: string;
}

/**
 * Host-facing inline button on /me/space-bookings. Flips a PENDING booking
 * to CONFIRMED. Once confirmed, the renter unlocks the entry code panel and
 * the check-in flow.
 */
export function ConfirmBookingButton({ locale, bookingId }: Props) {
  const t = useTranslations('spaces.bookings');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await confirmBookingAction(locale, bookingId);
        });
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="bg-surface text-bg hover:bg-surface/90 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
      >
        {isPending ? t('confirming') : t('confirm')}
      </button>
    </form>
  );
}
