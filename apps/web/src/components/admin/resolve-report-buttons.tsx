'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { resolveReportAction } from '@/lib/safety/actions';

interface Props {
  reportId: string;
}

/**
 * Two inline buttons on each open report — Resolved closes it as actioned,
 * Dismissed closes it as not-an-issue. Both call the same server action.
 */
export function ResolveReportButtons({ reportId }: Props) {
  const t = useTranslations('admin.moderation');
  const [isPending, startTransition] = useTransition();

  const act = (resolution: 'RESOLVED' | 'DISMISSED') => {
    startTransition(async () => {
      await resolveReportAction(reportId, resolution);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => act('RESOLVED')}
        disabled={isPending}
        className="bg-surface text-bg disabled:opacity-50 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium"
      >
        {t('resolve')}
      </button>
      <button
        type="button"
        onClick={() => act('DISMISSED')}
        disabled={isPending}
        className="border-line/80 text-surface hover:bg-surface/[0.04] inline-flex items-center rounded-full border px-3 py-1.5 text-xs"
      >
        {t('dismiss')}
      </button>
    </div>
  );
}
