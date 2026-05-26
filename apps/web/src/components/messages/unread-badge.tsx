'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

interface Props {
  /** Server-rendered initial count. */
  initialCount: number;
  /** The current user's ID, used to filter out own messages. */
  userId: string;
}

/**
 * Small red badge showing unread message count. Mounts in the site header.
 * Subscribes to Supabase Realtime INSERT on Message table to increment live,
 * and UPDATE events to decrement when messages are read.
 */
export function UnreadBadge({ initialCount, userId }: Props) {
  const [count, setCount] = useState(initialCount);

  // Keep in sync with server re-renders
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  // Subscribe to real-time changes
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('global-unread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
        },
        (payload) => {
          const row = payload.new as { senderId: string; status: string };
          // Only count messages from other users
          if (row.senderId !== userId) {
            setCount((prev) => prev + 1);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Message',
        },
        (payload) => {
          const oldRow = payload.old as { status: string; senderId: string };
          const newRow = payload.new as { status: string; senderId: string };
          // If a message was marked as READ and it was from another user, decrement
          if (
            newRow.senderId !== userId &&
            oldRow.status !== 'READ' &&
            newRow.status === 'READ'
          ) {
            setCount((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  if (count <= 0) return null;

  return (
    <span className="bg-red-500 text-2xs absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 font-mono text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
