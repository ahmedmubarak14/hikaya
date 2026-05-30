import 'server-only';

import { type Locale } from '@/i18n/config';
import { getCreatorByUsername } from '@/lib/creators/queries';
import {
  listInquiriesByClient,
  listInquiriesForCreator,
  type Inquiry,
} from '@/lib/inquiries/mock-store';
import { countUnreadFor } from '@/lib/messages/mock-store';
import { getMessagesByThread, listThreadsForUser } from '@/lib/messages/queries';
import { countMyUnreadNotifications, listMyNotifications, type NotificationRow } from '@/lib/notifications/queries';
import { getUnreadMessageCount } from '@/lib/messages/queries';

import type { Thread } from '@/lib/messages/mock-data';
import type { SessionUser } from '@/lib/auth/session';

export interface ThreadPreview {
  thread: Thread;
  preview?: string;
  unread: number;
  viewerSide: 'creator' | 'client';
}

export interface InquiryRow {
  inquiry: Inquiry;
  direction: 'sent' | 'received';
  /** Display name of the counterparty (creator for sent rows). */
  counterpartyName?: string;
  counterpartyUsername?: string;
}

export interface InboxData {
  notifications: NotificationRow[];
  threads: ThreadPreview[];
  inquiries: InquiryRow[];
  unread: {
    notifications: number;
    messages: number;
    total: number;
  };
}

/**
 * Aggregate the signed-in user's notifications, message threads, and inquiries
 * into a single payload for the unified inbox. Each sub-feature keeps its own
 * storage; this just fans out the reads and normalizes them for one screen.
 */
export async function getInboxData(user: SessionUser, locale: Locale): Promise<InboxData> {
  const [notifications, threads, sent] = await Promise.all([
    listMyNotifications(user.id, locale, 100),
    listThreadsForUser(user.id),
    Promise.resolve(listInquiriesByClient(user.id)),
  ]);

  const threadPreviews: ThreadPreview[] = await Promise.all(
    threads.map(async (thread) => {
      const messages = await getMessagesByThread(thread.id);
      const last = messages[messages.length - 1];
      const viewerSide: 'creator' | 'client' =
        thread.creatorUserId === user.id ? 'creator' : 'client';
      return {
        thread,
        preview: last?.body,
        unread: countUnreadFor(thread, user.id),
        viewerSide,
      };
    }),
  );

  // Inquiries sent by this user (as a client) — resolve the creator name.
  const sentCreators = await Promise.all(sent.map((i) => getCreatorByUsername(i.creatorUsername)));
  const sentRows: InquiryRow[] = sent.map((inquiry, idx) => {
    const creator = sentCreators[idx];
    return {
      inquiry,
      direction: 'sent',
      counterpartyName: creator
        ? locale === 'ar'
          ? creator.displayNameAr
          : creator.displayNameEn
        : undefined,
      counterpartyUsername: creator?.username,
    };
  });

  // Inquiries received by this user (as a creator).
  const received = user.username ? listInquiriesForCreator(user.username) : [];
  const receivedRows: InquiryRow[] = received.map((inquiry) => ({
    inquiry,
    direction: 'received',
  }));

  const inquiries = [...receivedRows, ...sentRows].sort((a, b) =>
    b.inquiry.createdAt.localeCompare(a.inquiry.createdAt),
  );

  const [unreadNotifications, unreadMessages] = await Promise.all([
    countMyUnreadNotifications(user.id),
    getUnreadMessageCount(user.id),
  ]);

  return {
    notifications,
    threads: threadPreviews,
    inquiries,
    unread: {
      notifications: unreadNotifications,
      messages: unreadMessages,
      total: unreadNotifications + unreadMessages,
    },
  };
}

/**
 * Cheap total-unread count (notifications + messages) for the sidebar badge.
 */
export async function countInboxUnread(userId: string): Promise<number> {
  const [n, m] = await Promise.all([
    countMyUnreadNotifications(userId),
    getUnreadMessageCount(userId),
  ]);
  return n + m;
}
