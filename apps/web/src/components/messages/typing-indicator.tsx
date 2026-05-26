'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

interface Props {
  threadId: string;
  currentUserId: string;
  otherUserName: string;
}

/**
 * Listens for 'typing' broadcast events on the thread channel and shows
 * a "Name is typing..." indicator. Fades out after 3 seconds of silence.
 */
export function TypingIndicator({ threadId, currentUserId, otherUserName }: Props) {
  const t = useTranslations('messages.typing');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel(`typing-${threadId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const senderId = payload.payload?.userId as string | undefined;
        if (senderId && senderId !== currentUserId) {
          setIsTyping(true);
          if (fadeTimer) clearTimeout(fadeTimer);
          fadeTimer = setTimeout(() => setIsTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      void supabase.removeChannel(channel);
    };
  }, [threadId, currentUserId]);

  if (!isTyping) return null;

  return (
    <div className="text-surface/50 animate-pulse px-1 py-2 text-sm">
      {t('indicator', { name: otherUserName })}
    </div>
  );
}

/**
 * Hook to broadcast typing events on a thread channel.
 * Debounces to at most one event every 2 seconds.
 */
export function useTypingBroadcast(threadId: string, currentUserId: string) {
  const [lastBroadcast, setLastBroadcast] = useState(0);

  const broadcastTyping = () => {
    const now = Date.now();
    if (now - lastBroadcast < 2000) return;
    setLastBroadcast(now);

    const supabase = createClient();
    const channel = supabase.channel(`typing-${threadId}`);
    // Subscribe first then send — Supabase requires subscription for broadcast
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUserId },
        });
        // Unsubscribe after a short delay to clean up
        setTimeout(() => {
          void supabase.removeChannel(channel);
        }, 500);
      }
    });
  };

  return { broadcastTyping };
}
