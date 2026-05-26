'use client';

import { useRef, useState, useTransition } from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@hikaya/ui';

import {
  reportContentAction,
  type ReportReason,
  type ReportResourceType,
} from '@/lib/moderation/actions';

interface Props {
  resourceType: ReportResourceType;
  resourceId: string;
  /** Optional additional CSS class names. */
  className?: string;
}

const REASONS: ReportReason[] = [
  'SPAM',
  'HARASSMENT',
  'INAPPROPRIATE_CONTENT',
  'FRAUD',
  'IMPERSONATION',
  'OTHER',
];

export function ReportButton({ resourceType, resourceId, className }: Props) {
  const t = useTranslations('moderation');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleOpen = () => {
    setOpen(true);
    setSubmitted(false);
    setError('');
    setReason('');
    setDescription('');
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setOpen(false);
    dialogRef.current?.close();
  };

  const handleSubmit = () => {
    if (!reason) return;

    startTransition(async () => {
      const result = await reportContentAction(
        resourceType,
        resourceId,
        reason,
        description || undefined,
      );

      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(t(`errors.${result.error}` as Parameters<typeof t>[0]));
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'text-surface/40 hover:text-surface/70 inline-flex items-center gap-1.5 text-xs transition-colors',
          className,
        )}
        aria-label={t('reportCta')}
      >
        {/* Flag icon (SVG) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        <span>{t('reportCta')}</span>
      </button>

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={dialogRef}
        className={cn(
          'bg-ground text-surface border-surface/10 w-full max-w-md rounded-xl border p-6 shadow-xl backdrop:bg-black/50',
          !open && 'hidden',
        )}
        onClick={(e) => {
          // Close on backdrop click
          if (e.target === dialogRef.current) handleClose();
        }}
      >
        {submitted ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">{t('reportSentTitle')}</h3>
            <p className="text-surface/60 text-sm">{t('reportSentBody')}</p>
            <button
              type="button"
              onClick={handleClose}
              className="bg-accent text-ink mt-2 self-start rounded-full px-5 py-2 text-sm font-medium"
            >
              {t('reportClose')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">{t('reportTitle')}</h3>
            <p className="text-surface/60 text-sm">{t('reportSubtitle')}</p>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t('reportReasonLabel')}</span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="border-surface/20 bg-ground text-surface rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">{t('reportReasonPlaceholder')}</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {t(`reasons.${r}` as Parameters<typeof t>[0])}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t('reportDescriptionLabel')}</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('reportDescriptionPlaceholder')}
                rows={3}
                className="border-surface/20 bg-ground text-surface resize-none rounded-lg border px-3 py-2 text-sm"
              />
            </label>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!reason || isPending}
                className="bg-accent text-ink rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50"
              >
                {isPending ? t('reportSubmitting') : t('reportSubmit')}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="text-surface/60 hover:text-surface text-sm transition-colors"
              >
                {t('reportCancel')}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
