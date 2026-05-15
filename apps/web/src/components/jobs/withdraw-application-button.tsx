'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { type Locale } from '@/i18n/config';
import { withdrawApplicationAction } from '@/lib/jobs/actions';

interface Props {
  locale: Locale;
  applicationId: string;
}

export function WithdrawApplicationButton({ locale, applicationId }: Props) {
  const t = useTranslations('jobs.applications');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={async () => {
        startTransition(async () => {
          await withdrawApplicationAction(locale, applicationId);
        });
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        onClick={(e) => {
          if (!confirm(t('withdrawConfirm'))) e.preventDefault();
        }}
        className="text-2xs text-accent-secondary hover:bg-accent-secondary/10 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
      >
        {t('withdraw')}
      </button>
    </form>
  );
}
