'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { deleteQuoteAction } from '@/lib/quotes/actions';

interface Props {
  locale: Locale;
  quoteId: string;
}

export function DeleteQuoteButton({ locale, quoteId }: Props) {
  const t = useTranslations('quotes.detail');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={async () => {
        startTransition(async () => {
          await deleteQuoteAction(locale, quoteId);
        });
      }}
    >
      <Button
        type="submit"
        size="sm"
        variant="destructive"
        isLoading={isPending}
        onClick={(e) => {
          if (!confirm(t('deleteConfirm'))) e.preventDefault();
        }}
      >
        {t('delete')}
      </Button>
    </form>
  );
}
