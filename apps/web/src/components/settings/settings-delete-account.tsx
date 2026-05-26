'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { deleteAccountAction } from '@/lib/settings/actions';

interface Props {
  locale: Locale;
}

export function SettingsDeleteAccount({ locale }: Props) {
  const t = useTranslations('settings');
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccountAction(locale);
      if (!result.ok) {
        setError(result.error ?? 'UNKNOWN');
      }
      // On success, the server action signs out and redirects
    });
  };

  return (
    <div className="border-accent-secondary/30 bg-accent-secondary/5 rounded-lg border p-6">
      <h3 className="text-surface text-lg font-semibold">{t('deleteTitle')}</h3>
      <p className="text-surface/60 mt-2 text-sm">{t('deleteBody')}</p>

      {error ? (
        <p className="text-accent-secondary mt-3 text-sm" role="alert">
          {t('deleteError')}
        </p>
      ) : null}

      {showConfirm ? (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-accent-secondary text-sm font-medium">{t('deleteConfirm')}</p>
          <div className="flex gap-2">
            <Button
              size="md"
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
            >
              {t('deleteCancel')}
            </Button>
            <Button
              size="md"
              variant="primary"
              onClick={handleDelete}
              isLoading={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('deleteConfirmCta')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="md"
          variant="outline"
          onClick={() => setShowConfirm(true)}
          className="mt-4"
        >
          {t('deleteCta')}
        </Button>
      )}
    </div>
  );
}
