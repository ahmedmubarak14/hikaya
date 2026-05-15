'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { approveQuoteAction, rejectQuoteAction, type QuoteResult } from '@/lib/quotes/actions';

interface Props {
  locale: Locale;
  shareSlug: string;
  expired: boolean;
}

/**
 * Approve / Reject pair on the public quote page. Approve calls the server
 * action directly (which redirects to the new contract). Reject opens an
 * inline reason form.
 */
export function ClientDecisionButtons({ locale, shareSlug, expired }: Props) {
  const t = useTranslations('quotes.viewer');
  const [isApproving, startApprove] = useTransition();
  const [showReject, setShowReject] = useState(false);

  const [rejectState, rejectAction] = useFormState<QuoteResult | null, FormData>(
    rejectQuoteAction.bind(null, locale, shareSlug),
    null,
  );
  const [isRejecting, startReject] = useTransition();

  if (expired) {
    return (
      <div className="border-surface/15 bg-surface/[0.03] text-surface/70 rounded-md border p-4 text-sm">
        {t('expired')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <form
          action={async () => {
            startApprove(async () => {
              await approveQuoteAction(locale, shareSlug);
            });
          }}
        >
          <Button type="submit" size="lg" variant="primary" isLoading={isApproving}>
            {t('approveCta')}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setShowReject((v) => !v)}
          className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
        >
          {showReject ? t('cancel') : t('rejectCta')}
        </button>
      </div>

      {showReject ? (
        <form
          action={(fd) => {
            startReject(() => rejectAction(fd));
          }}
          className="border-surface/10 bg-surface/[0.03] flex flex-col gap-3 rounded-md border p-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-surface/80 [lang=ar]:font-sansAr text-sm font-medium">
              {t('rejectReason')}
            </span>
            <textarea
              name="reason"
              rows={3}
              placeholder={t('rejectReasonPlaceholder')}
              className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-base outline-none"
            />
            <span className="text-surface/50 text-xs">{t('rejectReasonHint')}</span>
          </label>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" variant="destructive" isLoading={isRejecting}>
              {t('rejectConfirm')}
            </Button>
            {rejectState?.ok ? (
              <span className="text-2xs text-surface/60">{t('rejected')}</span>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
