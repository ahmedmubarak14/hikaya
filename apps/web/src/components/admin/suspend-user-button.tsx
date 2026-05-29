'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { suspendUserAction, unsuspendUserAction } from '@/lib/admin/actions';

interface Props {
  userId: string;
  isSuspended: boolean;
}

/**
 * Admin-only inline button on the user table. Flips User.isSuspended. The
 * server action enforces the admin role check.
 */
export function SuspendUserButton({ userId, isSuspended }: Props) {
  const t = useTranslations('admin');
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    startTransition(async () => {
      if (isSuspended) {
        await unsuspendUserAction(userId);
      } else {
        await suspendUserAction(userId);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      className="text-muted hover:text-surface text-xs transition-colors disabled:opacity-50"
    >
      {isPending ? '…' : isSuspended ? t('unsuspend') : t('suspend')}
    </button>
  );
}
