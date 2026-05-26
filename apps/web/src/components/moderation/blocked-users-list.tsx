'use client';

import { useState, useTransition } from 'react';

import { useTranslations } from 'next-intl';

import { unblockUserAction } from '@/lib/moderation/actions';

interface BlockedUserRow {
  id: string;
  blockedId: string;
  displayName: string;
  email: string;
  createdAt: string;
}

interface Props {
  initialList: BlockedUserRow[];
}

export function BlockedUsersList({ initialList }: Props) {
  const t = useTranslations('moderation');
  const [users, setUsers] = useState(initialList);
  const [isPending, startTransition] = useTransition();

  const handleUnblock = (blockedId: string) => {
    startTransition(async () => {
      const result = await unblockUserAction(blockedId);
      if (result.ok) {
        setUsers((prev) => prev.filter((u) => u.blockedId !== blockedId));
      }
    });
  };

  if (users.length === 0) {
    return (
      <p className="text-surface/40 text-sm">{t('blockedEmpty')}</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {users.map((user) => (
        <li
          key={user.id}
          className="border-surface/10 flex items-center justify-between rounded-lg border p-4"
        >
          <div>
            <p className="text-surface text-sm font-medium">{user.displayName}</p>
            <p className="text-surface/40 text-xs">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => handleUnblock(user.blockedId)}
            disabled={isPending}
            className="text-surface/50 hover:text-surface text-xs transition-colors disabled:opacity-50"
          >
            {t('unblockCta')}
          </button>
        </li>
      ))}
    </ul>
  );
}
