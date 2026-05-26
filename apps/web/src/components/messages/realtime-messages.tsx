'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { markMessagesAsReadAction } from '@/lib/messages/actions';
import type { Message } from '@/lib/messages/mock-data';
import { createClient } from '@/lib/supabase/client';

import { MessageAttachments } from './message-attachments';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';

interface Props {
  threadId: string;
  currentUserId: string;
  initialMessages: Message[];
  otherUserName: string;
}

/**
 * Real-time message list. Receives initial messages from the server, then
 * subscribes to Supabase Realtime for INSERT (new messages) and UPDATE
 * (read receipt changes) events on the Message table for this thread.
 */
export function RealtimeMessages({
  threadId,
  currentUserId,
  initialMessages,
  otherUserName,
}: Props) {
  const t = useTranslations('messages.thread');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep messages in sync if server re-renders with fresh data
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark messages as read when the component mounts or new messages arrive
  const markRead = useCallback(async () => {
    const hasUnread = messages.some(
      (m) => m.senderId !== currentUserId && m.status !== 'READ',
    );
    if (hasUnread) {
      await markMessagesAsReadAction(threadId);
    }
  }, [messages, currentUserId, threadId]);

  useEffect(() => {
    void markRead();
  }, [markRead]);

  // Subscribe to Supabase Realtime
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `threadId=eq.${threadId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            threadId: string;
            senderId: string;
            body: string;
            attachmentUrls?: string[] | null;
            status: string;
            readAt: string | null;
            createdAt: string;
          };

          const newMsg: Message = {
            id: row.id,
            threadId: row.threadId,
            senderId: row.senderId,
            body: row.body,
            attachmentUrls: row.attachmentUrls ?? undefined,
            status: row.status as Message['status'],
            readAt: row.readAt ?? undefined,
            createdAt: row.createdAt,
          };

          setMessages((prev) => {
            // Prevent duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // If the new message is from the other person, mark it as read
          if (newMsg.senderId !== currentUserId) {
            void markMessagesAsReadAction(threadId);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Message',
          filter: `threadId=eq.${threadId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            status: string;
            readAt: string | null;
          };

          setMessages((prev) =>
            prev.map((m) =>
              m.id === row.id
                ? {
                    ...m,
                    status: row.status as Message['status'],
                    readAt: row.readAt ?? undefined,
                  }
                : m,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, currentUserId]);

  return (
    <>
      <section className="flex flex-1 flex-col-reverse overflow-y-auto px-6 py-6 md:px-0">
        <div>
          <ul className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <li className="text-2xs text-surface/40 py-12 text-center">{t('empty')}</li>
            ) : (
              messages.map((m) => (
                <li key={m.id}>
                  <MessageBubble message={m} mine={m.senderId === currentUserId} />
                  {m.attachmentUrls && m.attachmentUrls.length > 0 ? (
                    <MessageAttachments
                      urls={m.attachmentUrls}
                      mine={m.senderId === currentUserId}
                    />
                  ) : null}
                </li>
              ))
            )}
          </ul>
          <div ref={bottomRef} />
          <TypingIndicator
            threadId={threadId}
            currentUserId={currentUserId}
            otherUserName={otherUserName}
          />
        </div>
      </section>
    </>
  );
}
