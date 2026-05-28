'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { type Locale } from '@/i18n/config';
import {
  blockUserAction,
  reportAction,
  type ReportReasonKind,
  type ReportTargetKind,
} from '@/lib/safety/actions';
import { cn } from '@/lib/utils';

interface Props {
  locale: Locale;
  /** User id of the person being blocked / reported. */
  targetUserId: string | null;
  /** What kind of thing is being reported. */
  reportTargetKind: ReportTargetKind;
  /** Optional ref of the target entity (thread id, message id, etc.). */
  reportTargetRef?: string;
  /** When false, the Block button is hidden (e.g. you can't block on a profile). */
  canBlock?: boolean;
}

const REASONS: ReportReasonKind[] = ['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'OTHER'];

/**
 * Two-button safety affordance used on threads, profiles, and any other
 * place where one user interacts with another. Renders Block + Report.
 * Report opens an inline dialog for picking a reason and adding a note.
 */
export function SafetyMenu({
  locale,
  targetUserId,
  reportTargetKind,
  reportTargetRef,
  canBlock = true,
}: Props) {
  const t = useTranslations('safety');
  const [isBlocking, startBlock] = useTransition();
  const [isReporting, startReport] = useTransition();
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState<ReportReasonKind>('SPAM');
  const [note, setNote] = useState('');
  const [done, setDone] = useState<'BLOCKED' | 'REPORTED' | null>(null);

  const handleBlock = () => {
    if (!targetUserId) return;
    startBlock(async () => {
      const r = await blockUserAction(locale, targetUserId);
      if (r.ok) setDone('BLOCKED');
    });
  };

  const handleReport = () => {
    startReport(async () => {
      const r = await reportAction(locale, {
        targetUserId,
        targetKind: reportTargetKind,
        targetRef: reportTargetRef,
        reasonKind: reason,
        reasonNote: note.trim() || undefined,
      });
      if (r.ok) {
        setDone('REPORTED');
        setShowReport(false);
      }
    });
  };

  if (done) {
    return (
      <p className="text-muted text-xs">
        {done === 'BLOCKED' ? t('blocked') : t('reported')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {canBlock && targetUserId ? (
          <button
            type="button"
            onClick={handleBlock}
            disabled={isBlocking}
            className="border-line/80 text-surface hover:bg-surface/[0.04] inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
          >
            {isBlocking ? t('blocking') : t('block')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setShowReport((v) => !v)}
          className="border-line/80 text-surface hover:bg-surface/[0.04] inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition-colors"
        >
          {t('report')}
        </button>
      </div>

      {showReport ? (
        <div className="border-line/60 bg-paper flex flex-col gap-3 rounded-lg border p-3">
          <fieldset className="flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <label
                key={r}
                className={cn(
                  'border-line/60 text-surface inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                  reason === r ? 'bg-surface text-bg' : 'hover:bg-surface/[0.04]',
                )}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="sr-only"
                />
                {t(`reason_${r}` as 'reason_SPAM')}
              </label>
            ))}
          </fieldset>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            rows={2}
            className="border-line/60 bg-bg/40 text-surface focus-visible:border-accent rounded-md border px-2.5 py-2 text-xs outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReport}
              disabled={isReporting}
              className="bg-surface text-bg disabled:opacity-50 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium"
            >
              {isReporting ? t('submitting') : t('submitReport')}
            </button>
            <button
              type="button"
              onClick={() => setShowReport(false)}
              className="text-muted hover:text-surface text-xs"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
