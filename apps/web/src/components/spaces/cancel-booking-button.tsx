'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { cancelBookingAction } from '@/lib/spaces/actions';

interface Props {
  locale: Locale;
  bookingId: string;
}

export function CancelBookingButton({ locale, bookingId }: Props) {
  const t = useTranslations('spaces.rentals');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={async () => {
        startTransition(async () => {
          await cancelBookingAction(locale, bookingId);
        });
      }}
    >
      <Button
        type="submit"
        size="sm"
        variant="destructive"
        isLoading={isPending}
        onClick={(e) => {
          if (!confirm(t('cancelConfirm'))) e.preventDefault();
        }}
      >
        {t('cancel')}
      </Button>
    </form>
  );
}
