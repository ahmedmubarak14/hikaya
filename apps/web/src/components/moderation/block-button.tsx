'use client';

import { useState, useTransition } from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@hikaya/ui';

import { blockUserAction, unblockUserAction } from '@/lib/moderation/actions';

interface Props {
  userId: string;
  initialBlocked: boolean;
  /** Optional additional CSS class names. */
  className?: string;
}

export function BlockButton({ userId, initialBlocked, className }: Props) {
  const t = useTranslations('moderation');
  const [blocked, setBlocked] = useState(initialBlocked);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      if (blocked) {
        const result = await unblockUserAction(userId);
        if (result.ok) setBlocked(false);
      } else {
        const result = await blockUserAction(userId);
        if (result.ok) setBlocked(true);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50',
        blocked
          ? 'border-surface/20 text-surface/60 hover:border-surface/40 hover:text-surface'
          : 'border-red-500/30 text-red-500 hover:border-red-500/60 hover:bg-red-500/5',
        className,
      )}
      aria-label={blocked ? t('unblockCta') : t('blockCta')}
    >
      {/* Block icon (SVG) */}
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
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
      <span>{blocked ? t('unblockCta') : t('blockCta')}</span>
    </button>
  );
}
