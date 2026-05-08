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
        className="rounded-full px-3 py-1.5 font-mono text-2xs uppercase tracking-widest text-accent-secondary transition-colors hover:bg-accent-secondary/10 disabled:opacity-50 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
      >
        {t('withdraw')}
      </button>
    </form>
  );
}
