'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { fileDisputeAction, type DisputeReason } from '@/lib/disputes/actions';

interface Props {
  locale: Locale;
}

const REASON_OPTIONS: DisputeReason[] = ['QUALITY', 'TIMELINESS', 'NO_SHOW', 'OTHER'];

export function FileDisputeForm({ locale }: Props) {
  const t = useTranslations('disputes');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [bookingId, setBookingId] = useState('');
  const [reason, setReason] = useState<DisputeReason>('QUALITY');
  const [description, setDescription] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const urls = evidenceUrls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);

      const result = await fileDisputeAction({
        bookingId,
        reason,
        description,
        evidenceUrls: urls,
      });

      if (result.ok) {
        router.push(`/${locale}/me/disputes`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        label={t('form.bookingId')}
        value={bookingId}
        onChange={(e) => setBookingId(e.target.value)}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-surface/80 text-sm font-medium">
          {t('form.reason')}
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as DisputeReason)}
          className="border-surface/15 bg-surface/[0.03] text-surface rounded-md border px-3 py-2 text-sm"
        >
          {REASON_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {t(`reason.${r}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-surface/80 text-sm font-medium">
          {t('form.description')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
          minLength={20}
          className="border-surface/15 bg-surface/[0.03] text-surface rounded-md border px-3 py-2 text-sm"
          placeholder={t('form.descriptionPlaceholder')}
        />
        <span className="text-surface/50 text-xs">{t('form.descriptionHint')}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-surface/80 text-sm font-medium">
          {t('form.evidenceUrls')}
        </label>
        <textarea
          value={evidenceUrls}
          onChange={(e) => setEvidenceUrls(e.target.value)}
          rows={3}
          className="border-surface/15 bg-surface/[0.03] text-surface rounded-md border px-3 py-2 text-sm"
          placeholder={t('form.evidenceUrlsPlaceholder')}
        />
        <span className="text-surface/50 text-xs">{t('form.evidenceUrlsHint')}</span>
      </div>

      {error && (
        <p className="text-accent-secondary text-sm" role="alert">
          {t(`errors.${error}` as Parameters<typeof t>[0])}
        </p>
      )}

      <Button type="submit" size="lg" isLoading={isPending}>
        {t('form.submit')}
      </Button>
    </form>
  );
}
