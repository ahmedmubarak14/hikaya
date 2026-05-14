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
      <div className="rounded-md border border-surface/15 bg-surface/[0.03] p-4 text-sm text-surface/70">
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
          className="rounded-full border border-surface/15 px-5 py-2 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
        >
          {showReject ? t('cancel') : t('rejectCta')}
        </button>
      </div>

      {showReject ? (
        <form
          action={(fd) => {
            startReject(() => rejectAction(fd));
          }}
          className="flex flex-col gap-3 rounded-md border border-surface/10 bg-surface/[0.03] p-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-surface/80 [lang=ar]:font-sansAr">{t('rejectReason')}</span>
            <textarea
              name="reason"
              rows={3}
              placeholder={t('rejectReasonPlaceholder')}
              className="rounded-md border border-surface/15 bg-surface/5 px-3 py-2 text-base text-surface outline-none focus-visible:border-accent"
            />
            <span className="text-xs text-surface/50">{t('rejectReasonHint')}</span>
          </label>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" variant="destructive" isLoading={isRejecting}>
              {t('rejectConfirm')}
            </Button>
            {rejectState?.ok ? (
              <span className="text-2xs text-surface/60">
                {t('rejected')}
              </span>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
