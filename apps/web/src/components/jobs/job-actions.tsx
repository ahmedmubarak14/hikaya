'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { closeJobAction, markJobFilledAction } from '@/lib/jobs/actions';

interface Props {
  locale: Locale;
  jobId: string;
}

export function JobActions({ locale, jobId }: Props) {
  const t = useTranslations('jobs.detail');
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        action={async () => {
          startTransition(async () => {
            await markJobFilledAction(locale, jobId);
          });
        }}
      >
        <Button type="submit" size="sm" variant="primary" isLoading={isPending}>
          {t('markFilled')}
        </Button>
      </form>
      <form
        action={async () => {
          startTransition(async () => {
            await closeJobAction(locale, jobId);
          });
        }}
      >
        <Button
          type="submit"
          size="sm"
          variant="outline"
          isLoading={isPending}
          onClick={(e) => {
            if (!confirm(t('closeConfirm'))) e.preventDefault();
          }}
        >
          {t('close')}
        </Button>
      </form>
    </div>
  );
}
