import 'server-only';

import { randomBytes, randomUUID } from 'node:crypto';

import { findUserByEmail, type MockUser } from '@/lib/auth/mock-store';

import {
  SEED_THREAD_BODIES,
  SEED_THREAD_PARTICIPANTS,
  type Message,
  type Thread,
} from './mock-data';

/**
 * Mutable in-memory store for threads + messages. HMR-safe.
 *
 * Threads are seeded lazily on first read, because the seeded mock-auth users
 * are created with random UUIDs at boot — we have to wait for them to exist
 * before we can wire up a thread that points to their ids.
 */

interface Store {
  threads: Map<string, Thread>;
  /** key: threadId → ordered messages (oldest first). */
  messages: Map<string, Message[]>;
  seeded: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaMessagesStore: Store | undefined;
}

const store: Store = globalThis.__hikayaMessagesStore ?? {
  threads: new Map(),
  messages: new Map(),
  seeded: false,
};

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaMessagesStore = store;
}

function seedIfNeeded(): void {
  if (store.seeded) return;

  const creator = findUserByEmail(SEED_THREAD_PARTICIPANTS.creatorEmail);
  const client = findUserByEmail(SEED_THREAD_PARTICIPANTS.clientEmail);
  if (!creator || !client) return; // auth store hasn't seeded yet — try again later

  const threadId = `t_${randomBytes(6).toString('hex')}`;
  const created = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const thread: Thread = {
    id: threadId,
    type: 'GENERAL',
    creatorUserId: creator.id,
    clientUserId: client.id,
    creatorName: SEED_THREAD_PARTICIPANTS.creatorName,
    clientName: SEED_THREAD_PARTICIPANTS.clientName,
    createdAt: created,
  };

  const msgs: Message[] = SEED_THREAD_BODIES.map((seed) => {
    const sender = seed.senderEmail === SEED_THREAD_PARTICIPANTS.creatorEmail ? creator : client;
    const created = new Date(Date.now() + seed.offsetMinutes * 60 * 1000).toISOString();
    return {
      id: randomUUID(),
      threadId,
      senderId: sender.id,
      body: seed.body,
      status: 'DELIVERED' as const,
      createdAt: created,
    };
  });

  thread.lastMessageAt = msgs[msgs.length - 1]?.createdAt;

  store.threads.set(threadId, thread);
  store.messages.set(threadId, msgs);
  store.seeded = true;
}

/* ----------------------------------- read ---------------------------------- */

export function listThreadsForUser(userId: string): Thread[] {
  seedIfNeeded();
  return [...store.threads.values()]
    .filter((t) => t.creatorUserId === userId || t.clientUserId === userId)
    .sort((a, b) => (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt));
}

export function getThreadById(id: string): Thread | null {
  seedIfNeeded();
  return store.threads.get(id) ?? null;
}

export function getMessagesByThread(threadId: string): Message[] {
  seedIfNeeded();
  return store.messages.get(threadId) ?? [];
}

/** Count messages in a thread that are unread *for* `userId` (i.e. sent by the other side, not READ). */
export function countUnreadFor(thread: Thread, userId: string): number {
  const msgs = store.messages.get(thread.id) ?? [];
  return msgs.filter((m) => m.senderId !== userId && m.status !== 'READ').length;
}

/** Find an existing thread between two users (any direction); used by "Message" CTA. */
export function findThreadBetween(creatorUserId: string, clientUserId: string): Thread | null {
  seedIfNeeded();
  for (const t of store.threads.values()) {
    if (t.creatorUserId === creatorUserId && t.clientUserId === clientUserId) return t;
  }
  return null;
}

/* ---------------------------------- write ---------------------------------- */

export function startThread(input: {
  creatorUserId: string;
  clientUserId: string;
  creatorName: string;
  clientName: string;
  creatorAvatarUrl?: string;
  clientAvatarUrl?: string;
  initialMessage?: { senderId: string; body: string };
}): Thread {
  seedIfNeeded();
  const existing = findThreadBetween(input.creatorUserId, input.clientUserId);
  if (existing) return existing;

  const threadId = `t_${randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();
  const thread: Thread = {
    id: threadId,
    type: 'GENERAL',
    creatorUserId: input.creatorUserId,
    clientUserId: input.clientUserId,
    creatorName: input.creatorName,
    clientName: input.clientName,
    creatorAvatarUrl: input.creatorAvatarUrl,
    clientAvatarUrl: input.clientAvatarUrl,
    createdAt: now,
  };

  store.threads.set(threadId, thread);
  store.messages.set(threadId, []);

  if (input.initialMessage) {
    appendMessage(threadId, {
      senderId: input.initialMessage.senderId,
      body: input.initialMessage.body,
    });
  }

  return thread;
}

export function appendMessage(
  threadId: string,
  input: { senderId: string; body: string },
): Message {
  const thread = store.threads.get(threadId);
  if (!thread) throw new Error('THREAD_NOT_FOUND');

  const message: Message = {
    id: randomUUID(),
    threadId,
    senderId: input.senderId,
    body: input.body,
    status: 'DELIVERED',
    createdAt: new Date().toISOString(),
  };

  const list = store.messages.get(threadId) ?? [];
  list.push(message);
  store.messages.set(threadId, list);

  thread.lastMessageAt = message.createdAt;
  store.threads.set(threadId, thread);

  return message;
}

/** Mark every message in `threadId` not sent by `userId` as READ. */
export function markThreadRead(threadId: string, userId: string): number {
  const list = store.messages.get(threadId);
  if (!list) return 0;
  const now = new Date().toISOString();
  let touched = 0;
  for (const m of list) {
    if (m.senderId !== userId && m.status !== 'READ') {
      m.status = 'READ';
      m.readAt = now;
      touched += 1;
    }
  }
  return touched;
}

export function isParticipant(thread: Thread, userId: string): boolean {
  return thread.creatorUserId === userId || thread.clientUserId === userId;
}

export type { MockUser };
