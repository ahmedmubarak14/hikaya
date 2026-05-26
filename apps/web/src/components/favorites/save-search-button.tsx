'use client';

import { Button, Input } from '@hikaya/ui';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';


import { type Locale } from '@/i18n/config';
import { saveSearchAction } from '@/lib/creators/actions';

export function SaveSearchButton() {
  const t = useTranslations('favorites');
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  // Only show if there are active filters
  const city = searchParams.get('city');
  const discipline = searchParams.get('discipline');
  const available = searchParams.get('available');
  const hasFilters = Boolean(city || discipline || available);

  if (!hasFilters) return null;

  if (saved) {
    return (
      <span className="text-sage text-sm font-medium">{t('searchSaved')}</span>
    );
  }

  if (!showInput) {
    return (
      <button
        type="button"
        onClick={() => setShowInput(true)}
        className="text-accent-secondary hover:text-accent-secondary/80 text-sm font-medium underline underline-offset-4 transition-colors"
      >
        {t('saveSearch')}
      </button>
    );
  }

  const handleSave = () => {
    const params: Record<string, string> = {};
    if (city) params.city = city;
    if (discipline) params.discipline = discipline;
    if (available) params.available = available;

    startTransition(async () => {
      const result = await saveSearchAction(locale, name, params);
      if (result.ok) {
        setSaved(true);
        setShowInput(false);
      }
    });
  };

  return (
    <div className="flex items-end gap-2">
      <Input
        label={t('searchNameLabel')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('searchNamePlaceholder')}
        className="w-48"
      />
      <Button
        type="button"
        size="md"
        variant="outline"
        onClick={handleSave}
        isLoading={isPending}
      >
        {t('saveSearchCta')}
      </Button>
      <button
        type="button"
        onClick={() => setShowInput(false)}
        className="text-surface/60 hover:text-surface text-sm transition-colors"
      >
        {t('cancelSave')}
      </button>
    </div>
  );
}
