'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { findUserByEmail } from '@/lib/auth/mock-store';
import { getSession } from '@/lib/auth/session';
import { getCreatorByUsername } from '@/lib/creators/queries';

import {
  appendMessage,
  findThreadBetween,
  getThreadById,
  isParticipant,
  markThreadRead,
  startThread,
} from './mock-store';
import { sendMessageSchema, startThreadSchema } from './schemas';

export type MessageErrorKey =
  | 'INVALID_INPUT'
  | 'NOT_AUTHENTICATED'
  | 'CREATOR_NOT_FOUND'
  | 'CREATOR_HAS_NO_USER'
  | 'CANNOT_MESSAGE_SELF'
  | 'THREAD_NOT_FOUND'
  | 'NOT_PARTICIPANT'
  | 'UNKNOWN';

export interface MessageFailure {
  ok: false;
  error: MessageErrorKey;
  fieldErrors?: Record<string, string>;
}
export interface MessageSuccess {
  ok: true;
  message?: string;
}
export type MessageResult = MessageSuccess | MessageFailure;

function fieldErrorsFromZod(issues: { path: (string | number)[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/* ----------------------------- thread actions ----------------------------- */

/**
 * Public-profile "Message" CTA. Opens (or creates) a thread between the
 * signed-in user and the creator, then redirects to the thread page.
 *
 * Design constraint: the mock auth store and the creator store are separate;
 * a creator profile is owned by the user whose email matches `ownerEmail`. We
 * resolve through that email — when the API ships, it'll use a real fk.
 */
export async function startThreadAction(
  locale: Locale,
  _prev: MessageResult | null,
  formData: FormData,
): Promise<MessageResult> {
  const session = await getSession();
  if (!session) {
    const username = String(formData.get('creatorUsername') ?? '');
    redirect(`/${locale}/sign-in?next=/${locale}/${username}`);
  }

  const parsed = startThreadSchema.safeParse({
    creatorUsername: formData.get('creatorUsername'),
    body: formData.get('body') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const creator = await getCreatorByUsername(parsed.data.creatorUsername);
  if (!creator) return { ok: false, error: 'CREATOR_NOT_FOUND' };
  if (!creator.ownerEmail) return { ok: false, error: 'CREATOR_HAS_NO_USER' };

  const creatorUser = findUserByEmail(creator.ownerEmail);
  if (!creatorUser) return { ok: false, error: 'CREATOR_HAS_NO_USER' };
  if (creatorUser.id === session.user.id) return { ok: false, error: 'CANNOT_MESSAGE_SELF' };

  // Per the data model, creators sit on the creator side of the thread,
  // everyone else on the client side. Doesn't matter what role the visitor
  // signed in as — they're addressing this creator.
  const thread = startThread({
    creatorUserId: creatorUser.id,
    clientUserId: session.user.id,
    creatorName: creatorUser.displayName,
    clientName: session.user.displayName,
    creatorAvatarUrl: creator.avatarUrl,
    initialMessage: parsed.data.body
      ? { senderId: session.user.id, body: parsed.data.body }
      : undefined,
  });

  revalidatePath(`/${locale}/me/messages`);
  redirect(`/${locale}/me/messages/${thread.id}`);
}

export async function sendMessageAction(
  locale: Locale,
  threadId: string,
  _prev: MessageResult | null,
  formData: FormData,
): Promise<MessageResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const thread = getThreadById(threadId);
  if (!thread) return { ok: false, error: 'THREAD_NOT_FOUND' };
  if (!isParticipant(thread, session.user.id)) return { ok: false, error: 'NOT_PARTICIPANT' };

  const parsed = sendMessageSchema.safeParse({ body: formData.get('body') });
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  appendMessage(threadId, { senderId: session.user.id, body: parsed.data.body });

  revalidatePath(`/${locale}/me/messages`);
  revalidatePath(`/${locale}/me/messages/${threadId}`);

  return { ok: true };
}

export async function markThreadReadAction(locale: Locale, threadId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const thread = getThreadById(threadId);
  if (!thread || !isParticipant(thread, session.user.id)) return;

  const touched = markThreadRead(threadId, session.user.id);
  if (touched > 0) {
    revalidatePath(`/${locale}/me/messages`);
    revalidatePath(`/${locale}/me/messages/${threadId}`);
  }
}

/* ------------------------------ helper export ----------------------------- */

/** Used by the public profile button to know whether we already have a thread. */
export async function findExistingThread(creatorUserId: string, viewerUserId: string) {
  return findThreadBetween(creatorUserId, viewerUserId);
}
