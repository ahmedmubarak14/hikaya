'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { respondToDisputeAction } from '@/lib/disputes/actions';

interface Props {
  disputeId: string;
  locale: Locale;
}

export function RespondDisputeForm({ disputeId, locale: _locale }: Props) {
  const t = useTranslations('disputes');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await respondToDisputeAction({
        disputeId,
        response,
      });

      if (result.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return (
      <div className="border-accent/30 bg-accent/5 rounded-xl border p-5">
        <p className="text-surface font-medium">{t('responseSent')}</p>
        <p className="text-surface/60 mt-1 text-sm">{t('responseSentBody')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h3 className="text-surface text-lg font-semibold">{t('respondTitle')}</h3>
      <p className="text-surface/60 text-sm">{t('respondHint')}</p>

      <div className="flex flex-col gap-1.5">
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={5}
          required
          minLength={10}
          className="border-surface/15 bg-surface/[0.03] text-surface rounded-md border px-3 py-2 text-sm"
          placeholder={t('respondPlaceholder')}
        />
      </div>

      {error && (
        <p className="text-accent-secondary text-sm" role="alert">
          {t(`errors.${error}` as Parameters<typeof t>[0])}
        </p>
      )}

      <Button type="submit" size="lg" isLoading={isPending}>
        {t('respondSubmit')}
      </Button>
    </form>
  );
}
