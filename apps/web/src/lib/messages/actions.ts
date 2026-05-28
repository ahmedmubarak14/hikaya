'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getCreatorByUsername } from '@/lib/creators/queries';
import { createClient } from '@/lib/supabase/server';

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
  error?: undefined;
  fieldErrors?: undefined;
  message?: string;
}
export type MessageResult = MessageSuccess | MessageFailure;

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
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
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const creator = await getCreatorByUsername(parsed.data.creatorUsername);
  if (!creator) return { ok: false, error: 'CREATOR_NOT_FOUND' };
  if (!creator.ownerEmail) return { ok: false, error: 'CREATOR_HAS_NO_USER' };

  // Look up the creator's user row from Supabase User table (falling back to mock)
  const supabase = await createClient();

  const { data: creatorUser } = await supabase
    .from('User')
    .select('id, displayName')
    .eq('email', creator.ownerEmail)
    .maybeSingle();

  if (!creatorUser) return { ok: false, error: 'CREATOR_HAS_NO_USER' };
  if ((creatorUser.id as string) === session.user.id) {
    return { ok: false, error: 'CANNOT_MESSAGE_SELF' };
  }

  // Check for existing thread between these two users
  const { data: existingThread } = await supabase
    .from('Thread')
    .select('id')
    .eq('creatorUserId', creatorUser.id as string)
    .eq('clientUserId', session.user.id)
    .maybeSingle();

  let threadId: string;

  if (existingThread) {
    threadId = existingThread.id as string;
  } else {
    threadId = randomUUID();
    const now = new Date().toISOString();

    const { error: threadErr } = await supabase
      .from('Thread')
      .insert({
        id: threadId,
        type: 'GENERAL',
        creatorUserId: creatorUser.id as string,
        clientUserId: session.user.id,
        creatorName: creatorUser.displayName as string,
        clientName: session.user.displayName,
        creatorAvatarUrl: creator.avatarUrl || null,
        clientAvatarUrl: null,
        createdAt: now,
      });

    if (threadErr) {
      console.error('[messages/actions] startThreadAction create thread error:', threadErr.message);
      return { ok: false, error: 'UNKNOWN' };
    }
  }

  // If an initial message was provided, insert it
  if (parsed.data.body) {
    const msgNow = new Date().toISOString();
    const { error: msgErr } = await supabase
      .from('Message')
      .insert({
        id: randomUUID(),
        threadId,
        senderId: session.user.id,
        body: parsed.data.body,
        status: 'DELIVERED',
        createdAt: msgNow,
      });

    if (!msgErr) {
      // Update thread's lastMessageAt
      await supabase
        .from('Thread')
        .update({ lastMessageAt: msgNow })
        .eq('id', threadId);
    }
  }

  revalidatePath(`/${locale}/me/messages`);
  redirect(`/${locale}/me/messages/${threadId}`);
}

export async function sendMessageAction(
  locale: Locale,
  threadId: string,
  _prev: MessageResult | null,
  formData: FormData,
): Promise<MessageResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();

  const { data: thread, error: fetchErr } = await supabase
    .from('Thread')
    .select('id, creatorUserId, clientUserId')
    .eq('id', threadId)
    .maybeSingle();

  if (fetchErr || !thread) return { ok: false, error: 'THREAD_NOT_FOUND' };

  const isParticipant =
    (thread.creatorUserId as string) === session.user.id ||
    (thread.clientUserId as string) === session.user.id;
  if (!isParticipant) return { ok: false, error: 'NOT_PARTICIPANT' };

  // Parse attachment URLs from the form data
  const rawAttachmentUrls = formData.get('attachmentUrls');
  let attachmentUrls: string[] | undefined;
  if (rawAttachmentUrls && typeof rawAttachmentUrls === 'string') {
    try {
      attachmentUrls = JSON.parse(rawAttachmentUrls) as string[];
    } catch {
      attachmentUrls = undefined;
    }
  }

  const parsed = sendMessageSchema.safeParse({
    body: formData.get('body'),
    attachmentUrls: attachmentUrls?.length ? attachmentUrls : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const now = new Date().toISOString();

  const { error: insertErr } = await supabase
    .from('Message')
    .insert({
      id: randomUUID(),
      threadId,
      senderId: session.user.id,
      body: parsed.data.body,
      attachmentUrls: parsed.data.attachmentUrls ?? [],
      status: 'DELIVERED',
      createdAt: now,
    });

  if (insertErr) {
    console.error('[messages/actions] sendMessageAction error:', insertErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  // Update thread's lastMessageAt
  await supabase
    .from('Thread')
    .update({ lastMessageAt: now })
    .eq('id', threadId);

  revalidatePath(`/${locale}/me/messages`);
  revalidatePath(`/${locale}/me/messages/${threadId}`);

  // Email notification to the other participant. Skip if both sides have
  // been chatting in the last 60s (avoids spamming during a live thread).
  void notifyOnNewMessage({
    supabase,
    locale,
    threadId,
    senderId: session.user.id,
    senderName: session.user.displayName,
    body: parsed.data.body,
    recipientId:
      (thread.creatorUserId as string) === session.user.id
        ? (thread.clientUserId as string)
        : (thread.creatorUserId as string),
  });

  return { ok: true };
}

async function notifyOnNewMessage(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  locale: Locale;
  threadId: string;
  senderId: string;
  senderName: string;
  body: string;
  recipientId: string;
}): Promise<void> {
  const { data: recipient } = await input.supabase
    .from('User')
    .select('email, displayName')
    .eq('id', input.recipientId)
    .maybeSingle();
  if (!recipient?.email) return;

  // Suppress if the recipient also sent something in the last 60s — they're
  // probably actively in the thread.
  const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString();
  const { data: recentByRecipient } = await input.supabase
    .from('Message')
    .select('id')
    .eq('threadId', input.threadId)
    .eq('senderId', input.recipientId)
    .gte('createdAt', sixtySecondsAgo)
    .limit(1);
  if (recentByRecipient && recentByRecipient.length > 0) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const threadUrl = `${appUrl}/${input.locale}/me/messages/${input.threadId}`;
  const unsubscribeUrl = `${appUrl}/${input.locale}/me/settings#notifications`;
  const preview = input.body.slice(0, 280) + (input.body.length > 280 ? '…' : '');
  const { newMessageEmail } = await import('@/lib/email/templates');
  const { sendEmail } = await import('@/lib/email/client');
  const { subject, html } = newMessageEmail({
    recipientName: (recipient.displayName as string) ?? '',
    senderName: input.senderName,
    preview,
    threadUrl,
    unsubscribeUrl,
  });
  void sendEmail({ to: recipient.email as string, subject, html });
}

export async function markThreadReadAction(locale: Locale, threadId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const supabase = await createClient();

  const { data: thread } = await supabase
    .from('Thread')
    .select('id, creatorUserId, clientUserId')
    .eq('id', threadId)
    .maybeSingle();

  if (!thread) return;

  const isParticipant =
    (thread.creatorUserId as string) === session.user.id ||
    (thread.clientUserId as string) === session.user.id;
  if (!isParticipant) return;

  // Mark all messages in this thread not sent by the current user as READ
  const now = new Date().toISOString();
  const { data: updated } = await supabase
    .from('Message')
    .update({ status: 'READ', readAt: now })
    .eq('threadId', threadId)
    .neq('senderId', session.user.id)
    .neq('status', 'READ')
    .select('id');

  if (updated && updated.length > 0) {
    revalidatePath(`/${locale}/me/messages`);
    revalidatePath(`/${locale}/me/messages/${threadId}`);
  }
}

/**
 * Mark all unread messages in a thread as READ for the current user.
 * Alias for markThreadReadAction with a simpler signature for client components.
 */
export async function markMessagesAsReadAction(threadId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const supabase = await createClient();

  const { data: thread } = await supabase
    .from('Thread')
    .select('id, creatorUserId, clientUserId')
    .eq('id', threadId)
    .maybeSingle();

  if (!thread) return;

  const participant =
    (thread.creatorUserId as string) === session.user.id ||
    (thread.clientUserId as string) === session.user.id;
  if (!participant) return;

  const now = new Date().toISOString();
  await supabase
    .from('Message')
    .update({ status: 'READ', readAt: now })
    .eq('threadId', threadId)
    .neq('senderId', session.user.id)
    .neq('status', 'READ');
}

/* ------------------------------ helper export ----------------------------- */

/** Used by the public profile button to know whether we already have a thread. */
export async function findExistingThread(creatorUserId: string, viewerUserId: string) {
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from('Thread')
    .select('id, creatorUserId, clientUserId, creatorName, clientName, createdAt')
    .eq('creatorUserId', creatorUserId)
    .eq('clientUserId', viewerUserId)
    .maybeSingle();

  return thread ?? null;
}
