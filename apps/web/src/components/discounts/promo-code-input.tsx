'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button, Input } from '@hikaya/ui';

import { validateDiscountAction } from '@/lib/creators/actions';

interface Props {
  onApply: (result: {
    discountId: string;
    percentageOff: number | null;
    amountOffHalalas: number | null;
  }) => void;
  onClear: () => void;
}

export function PromoCodeInput({ onApply, onClear }: Props) {
  const t = useTranslations('discounts.promo');
  const [code, setCode] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    if (!code.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await validateDiscountAction(code);
      if (result.ok) {
        setApplied(true);
        onApply(result);
      } else {
        setError(t(`errors.${result.error}` as 'errors.INVALID_CODE'));
      }
    });
  };

  const handleClear = () => {
    setCode('');
    setError(null);
    setApplied(false);
    onClear();
  };

  if (applied) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sage text-sm font-medium">
          {t('applied', { code: code.toUpperCase() })}
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="text-surface/60 hover:text-surface text-xs underline transition-colors"
        >
          {t('remove')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-2">
        <Input
          label={t('label')}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder={t('placeholder')}
          className="flex-1"
        />
        <Button
          type="button"
          size="md"
          variant="outline"
          onClick={handleApply}
          isLoading={isPending}
        >
          {t('apply')}
        </Button>
      </div>
      {error ? <p className="text-accent-secondary text-xs">{error}</p> : null}
    </div>
  );
}
