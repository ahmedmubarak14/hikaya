'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { sendQuoteAction } from '@/lib/quotes/actions';

interface Props {
  locale: Locale;
  quoteId: string;
}

export function SendQuoteButton({ locale, quoteId }: Props) {
  const t = useTranslations('quotes.detail');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={async () => {
        startTransition(async () => {
          await sendQuoteAction(locale, quoteId);
        });
      }}
    >
      <Button type="submit" size="md" variant="primary" isLoading={isPending}>
        {t('send')}
      </Button>
    </form>
  );
}
