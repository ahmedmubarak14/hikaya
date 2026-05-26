'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { exportMyDataAction } from '@/lib/settings/actions';

export function SettingsDataExport() {
  const t = useTranslations('settings');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    setError(null);
    startTransition(async () => {
      const result = await exportMyDataAction();
      if (!result.ok) {
        setError(result.error ?? 'UNKNOWN');
        return;
      }

      // Trigger browser download
      const json = JSON.stringify(result.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hikaya-data-export-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="border-surface/10 bg-surface/[0.03] mb-6 rounded-lg border p-6">
      <h3 className="text-surface text-lg font-semibold">{t('exportTitle')}</h3>
      <p className="text-surface/60 mt-2 text-sm">{t('exportBody')}</p>

      {error ? (
        <p className="text-accent-secondary mt-3 text-sm" role="alert">
          {t('exportError')}
        </p>
      ) : null}

      <Button
        size="md"
        variant="outline"
        onClick={handleExport}
        isLoading={isPending}
        className="mt-4"
      >
        {isPending ? t('exportLoading') : t('exportCta')}
      </Button>
    </div>
  );
}
