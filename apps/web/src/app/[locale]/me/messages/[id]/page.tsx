import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { RealtimeComposer } from '@/components/messages/realtime-composer';
import { RealtimeMessages } from '@/components/messages/realtime-messages';
import { ThreadQuickActions } from '@/components/messages/thread-quick-actions';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { markThreadReadAction } from '@/lib/messages/actions';
import {
  getMessagesByThread,
  getThreadById,
} from '@/lib/messages/queries';
import {
  isParticipant,
  markThreadRead,
} from '@/lib/messages/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

// Auth-gated route — generate one placeholder per locale so Next has
// when EXPORT=1, so the placeholder id is never actually used.
export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  const { findUserByEmail } = await import('@/lib/auth/mock-store');
  const { listThreadsForUser } = await import('@/lib/messages/mock-store');
  const noor = findUserByEmail('noor@hikaya.sa');
  if (!noor) return locales.map((locale) => ({ locale, id: '_demo' }));
  const items = listThreadsForUser(noor.id);
  return locales.flatMap((locale) => {
    const real = items.map((item) => ({ locale, id: item.id }));
    // Always include a `_demo` placeholder so Next has a path to render
    // even when no items have been seeded for this entity.
    return real.length > 0 ? real : [{ locale, id: '_demo' }];
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const thread = await getThreadById(id);
  const t = await getTranslations({ locale, namespace: 'messages.thread' });
  if (!thread) return { title: t('title') };
  return { title: `${t('title')} · ${thread.creatorName}` };
}

export default async function ThreadDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/messages/${id}`);

  const thread = await getThreadById(id);
  if (!thread || !isParticipant(thread, session.user.id)) notFound();

  const t = await getTranslations('messages.thread');

  // Mark messages as READ on view. We do this synchronously before listing so
  // the rendered statuses already reflect "read". The action also revalidates
  // the list page so the inbox badge clears immediately.
  markThreadRead(thread.id, session.user.id);
  // Fire the action too so any client-side caches invalidate consistently.
  await markThreadReadAction(locale, thread.id);

  const messages = await getMessagesByThread(thread.id);
  const otherName =
    thread.creatorUserId === session.user.id ? thread.clientName : thread.creatorName;

  // Try to resolve the other user's email for quick actions (best-effort)
  let otherUserEmail: string | undefined;
  try {
    const { findUserById } = await import('@/lib/auth/mock-store');
    const otherId =
      thread.creatorUserId === session.user.id ? thread.clientUserId : thread.creatorUserId;
    const otherUser = findUserById(otherId);
    otherUserEmail = otherUser?.email;
  } catch {
    // Not critical — quick actions will work without the email
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-3xl flex-col px-4 md:px-6">
        <header className="border-surface/10 flex items-baseline justify-between gap-3 border-b px-6 py-5 md:px-0">
          <div className="flex flex-col gap-1.5">
            <Link
              href={`/${locale}/me/messages`}
              className="text-2xs text-surface/40 hover:text-surface transition-colors"
            >
              {'←'} {t('back')}
            </Link>
            <h1 className="text-surface text-2xl">{otherName}</h1>
          </div>
          <Badge tone={thread.type === 'BOOKING' ? 'sage' : 'neutral'}>
            {t(`type.${thread.type}` as 'type.GENERAL')}
          </Badge>
        </header>

        {/* Real-time message list — initial messages loaded server-side */}
        <RealtimeMessages
          threadId={thread.id}
          currentUserId={session.user.id}
          initialMessages={messages}
          otherUserName={otherName}
        />

        {/* Quick actions above the composer */}
        <ThreadQuickActions otherUserEmail={otherUserEmail} />

        {/* Enhanced composer with typing broadcast + attachments */}
        <RealtimeComposer
          locale={locale}
          threadId={thread.id}
          currentUserId={session.user.id}
        />
    </div>
  );
}
