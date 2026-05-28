'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { markNotificationReadAction } from '@/lib/notifications/actions';

interface MarkAllProps {
  /** True when at least one unread notification exists. */
  hasUnread: boolean;
}

export function MarkAllReadButton({ hasUnread }: MarkAllProps) {
  const t = useTranslations('notifications');
  const [isPending, startTransition] = useTransition();

  if (!hasUnread) return null;

  return (
    <form
      action={() => {
        startTransition(async () => {
          await markNotificationReadAction(null, { all: true });
        });
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="text-muted hover:text-surface text-xs transition-colors disabled:opacity-50"
      >
        {isPending ? t('markingAll') : t('markAllRead')}
      </button>
    </form>
  );
}

interface SingleProps {
  notificationId: string;
}

export function MarkSingleReadButton({ notificationId }: SingleProps) {
  const t = useTranslations('notifications');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await markNotificationReadAction(notificationId);
        });
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        aria-label={t('markRead')}
        className="text-muted hover:text-surface text-xs transition-colors disabled:opacity-50"
      >
        {t('markRead')}
      </button>
    </form>
  );
}
