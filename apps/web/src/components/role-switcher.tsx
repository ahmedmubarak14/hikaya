'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { cn } from '@hikaya/ui';

import { setActiveRole } from '@/lib/auth/active-role-actions';
import type { MockUserRole } from '@/lib/auth/mock-store';

interface Props {
  current: MockUserRole;
  available: MockUserRole[];
  labels: Record<MockUserRole, string>;
}

/**
 * Pill-style segmented role switcher. Shown in the header when the signed-in
 * user holds 2+ roles. Clicking flips the active pill optimistically, then
 * calls the server action to persist the cookie and refreshes the route so
 * dependent UI (redirects, /me copy, etc.) re-renders against the new role.
 *
 * Style matches the chip rail on /discover: ~28px tall, neutral surface bg,
 * active pill uses the inverse `bg-surface text-bg` for high contrast.
 */
export function RoleSwitcher({ current, available, labels }: Props) {
  const router = useRouter();
  const [active, setActive] = useState<MockUserRole>(current);
  const [, startTransition] = useTransition();

  function select(role: MockUserRole) {
    if (role === active) return;
    setActive(role); // optimistic flip
    startTransition(async () => {
      await setActiveRole(role);
      router.refresh();
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Switch active role"
      className="border-surface/15 bg-surface/[0.03] hidden h-7 items-center gap-0.5 rounded-full border p-0.5 md:flex"
    >
      {available.map((role) => {
        const isActive = role === active;
        return (
          <button
            key={role}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => select(role)}
            className={cn(
              'text-2xs rounded-full px-3 py-0.5 font-medium transition-colors',
              isActive ? 'bg-surface text-bg' : 'text-surface/60 hover:text-surface',
            )}
          >
            {labels[role]}
          </button>
        );
      })}
    </div>
  );
}
