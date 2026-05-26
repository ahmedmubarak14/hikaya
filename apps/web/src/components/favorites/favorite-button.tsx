'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { cn } from '@hikaya/ui';

import { toggleFavoriteAction } from '@/lib/creators/actions';

interface Props {
  creatorProfileId: string;
  initialFavorited: boolean;
}

export function FavoriteButton({ creatorProfileId, initialFavorited }: Props) {
  const t = useTranslations('favorites');
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when inside a Link
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleFavoriteAction(creatorProfileId);
      if (result.ok) {
        setIsFavorited(result.isFavorited);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={isFavorited ? t('unfavorite') : t('favorite')}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-full transition-all',
        isFavorited
          ? 'bg-accent-secondary/20 text-accent-secondary'
          : 'bg-bg/80 text-surface/60 hover:text-accent-secondary hover:bg-accent-secondary/10',
        isPending && 'opacity-50',
      )}
    >
      <span aria-hidden className="text-base">
        {isFavorited ? '♥' : '♡'}
      </span>
    </button>
  );
}
