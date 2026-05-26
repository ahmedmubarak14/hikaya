import 'server-only';

import type { Message, Thread } from './mock-data';
import {
  countUnreadFor as countUnreadForRaw,
  getMessagesByThread as getMessagesByThreadRaw,
  getThreadById as getThreadByIdRaw,
  listThreadsForUser as listThreadsForUserRaw,
} from './mock-store';

/**
 * Server-only query helpers. When EXPORT=1 (static export), we use mock data
 * directly. Otherwise we try the real Supabase query first and fall back to
 * mock data if the result is empty (gradual migration).
 */

const isStaticExport = process.env.EXPORT === '1';

export async function listThreadsForUser(userId: string): Promise<Thread[]> {
  if (!isStaticExport) {
    try {
      const { listThreadsForUserFromDB } = await import('./supabase-queries');
      const result = await listThreadsForUserFromDB(userId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return listThreadsForUserRaw(userId);
}

export async function getThreadById(id: string): Promise<Thread | null> {
  if (!isStaticExport) {
    try {
      const { getThreadByIdFromDB } = await import('./supabase-queries');
      const result = await getThreadByIdFromDB(id);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getThreadByIdRaw(id);
}

export async function getMessagesByThread(threadId: string): Promise<Message[]> {
  if (!isStaticExport) {
    try {
      const { getMessagesByThreadFromDB } = await import('./supabase-queries');
      const result = await getMessagesByThreadFromDB(threadId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getMessagesByThreadRaw(threadId);
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  if (!isStaticExport) {
    try {
      const { getUnreadMessageCountFromDB } = await import('./supabase-queries');
      return await getUnreadMessageCountFromDB(userId);
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  // Mock fallback: sum unread across all threads for the user
  const threads = listThreadsForUserRaw(userId);
  return threads.reduce((sum, thread) => sum + countUnreadForRaw(thread, userId), 0);
}
