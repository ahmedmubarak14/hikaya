import 'server-only';

import type { Message, MessageStatus, Thread, ThreadType } from './mock-data';

/**
 * Real Supabase queries for messaging (Thread + Message).
 *
 * Each function uses the Next.js server Supabase client (cookie-based auth,
 * anon key) and returns data shaped to match the `Thread` / `Message` types
 * from mock-data.ts so downstream components don't need changes.
 */

async function getClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

// ---------------------------------------------------------------------------
// Mapping helpers — DB row -> front-end shape
// ---------------------------------------------------------------------------

interface DbMessageRow {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  status: string;
  readAt: string | null;
  createdAt: string;
}

interface DbThreadRow {
  id: string;
  type: string;
  bookingId: string | null;
  creatorUserId: string;
  clientUserId: string;
  lastMessageAt: string | null;
  createdAt: string;
  creatorUser?: { displayName: string; avatarUrl: string | null } | null;
  clientUser?: { displayName: string; avatarUrl: string | null } | null;
}

function mapThread(row: DbThreadRow): Thread {
  return {
    id: row.id,
    type: row.type as ThreadType,
    bookingRef: row.bookingId ?? undefined,
    creatorUserId: row.creatorUserId,
    clientUserId: row.clientUserId,
    creatorName: row.creatorUser?.displayName ?? 'Creator',
    clientName: row.clientUser?.displayName ?? 'Client',
    creatorAvatarUrl: row.creatorUser?.avatarUrl ?? undefined,
    clientAvatarUrl: row.clientUser?.avatarUrl ?? undefined,
    lastMessageAt: row.lastMessageAt ?? undefined,
    createdAt: row.createdAt,
  };
}

function mapMessage(row: DbMessageRow): Message {
  return {
    id: row.id,
    threadId: row.threadId,
    senderId: row.senderId,
    body: row.body,
    status: row.status as MessageStatus,
    readAt: row.readAt ?? undefined,
    createdAt: row.createdAt,
  };
}

const THREAD_SELECT = `
  id, type, bookingId,
  creatorUserId, clientUserId,
  lastMessageAt, createdAt,
  creatorUser:User!creatorUserId ( displayName, avatarUrl ),
  clientUser:User!clientUserId ( displayName, avatarUrl )
`;

const MESSAGE_SELECT = `
  id, threadId, senderId, body, status, readAt, createdAt
`;

// ---------------------------------------------------------------------------
// Exported query functions
// ---------------------------------------------------------------------------

export async function listThreadsForUserFromDB(userId: string): Promise<Thread[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Thread')
    .select(THREAD_SELECT)
    .or(`creatorUserId.eq.${userId},clientUserId.eq.${userId}`)
    .order('lastMessageAt', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('[supabase-queries] listThreadsForUserFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapThread(row as DbThreadRow));
}

export async function getThreadByIdFromDB(id: string): Promise<Thread | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Thread')
    .select(THREAD_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getThreadByIdFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapThread(data as unknown as DbThreadRow);
}

export async function getMessagesByThreadFromDB(threadId: string): Promise<Message[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Message')
    .select(MESSAGE_SELECT)
    .eq('threadId', threadId)
    .order('createdAt', { ascending: true });

  if (error) {
    console.error('[supabase-queries] getMessagesByThreadFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapMessage(row as DbMessageRow));
}
