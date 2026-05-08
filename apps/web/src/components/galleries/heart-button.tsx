'use client';

import { useTranslations } from 'next-intl';
import { useOptimistic, useTransition } from 'react';

import { cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { toggleSelectionAction } from '@/lib/galleries/actions';

interface Props {
  locale: Locale;
  shareSlug: string;
  imageId: string;
  initialSelected: boolean;
  selectionCount?: number;
}

/**
 * Heart toggle in the public gallery viewer. Optimistic — flips state
 * immediately and lets the server action confirm in the background.
 */
export function HeartButton({ locale, shareSlug, imageId, initialSelected, selectionCount }: Props) {
  const t = useTranslations('gallery.heart');
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic<boolean, void>(initialSelected, (current) => !current);

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? t('unfavorite') : t('favorite')}
      onClick={() => {
        startTransition(() => {
          setOptimistic();
          void toggleSelectionAction(locale, shareSlug, imageId);
        });
      }}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-full border bg-bg/70 text-base backdrop-blur-sm transition-colors',
        optimistic
          ? 'border-accent-secondary text-accent-secondary'
          : 'border-surface/30 text-surface/80 hover:text-accent-secondary hover:border-accent-secondary/60',
      )}
    >
      <span aria-hidden>{optimistic ? '♥' : '♡'}</span>
      {selectionCount && selectionCount > 0 ? (
        <span className="sr-only">{selectionCount}</span>
      ) : null}
    </button>
  );
}
