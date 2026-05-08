import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { Composer } from '@/components/messages/composer';
import { MessageBubble } from '@/components/messages/message-bubble';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { markThreadReadAction } from '@/lib/messages/actions';
import {
  getMessagesByThread,
  getThreadById,
  isParticipant,
  markThreadRead,
} from '@/lib/messages/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const thread = getThreadById(id);
  const t = await getTranslations({ locale, namespace: 'messages.thread' });
  if (!thread) return { title: t('title') };
  return { title: `${t('title')} · ${thread.creatorName}` };
}

export default async function ThreadDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/messages/${id}`);

  const thread = getThreadById(id);
  if (!thread || !isParticipant(thread, session.user.id)) notFound();

  const t = await getTranslations('messages.thread');

  // Mark messages as READ on view. We do this synchronously before listing so
  // the rendered statuses already reflect "read". The action also revalidates
  // the list page so the inbox badge clears immediately.
  markThreadRead(thread.id, session.user.id);
  // Fire the action too so any client-side caches invalidate consistently.
  await markThreadReadAction(locale, thread.id);

  const messages = getMessagesByThread(thread.id);
  const otherName = thread.creatorUserId === session.user.id ? thread.clientName : thread.creatorName;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col px-0 md:px-6">
        <header className="flex items-baseline justify-between gap-3 border-b border-surface/10 px-6 py-5 md:px-0">
          <div className="flex flex-col gap-1.5">
            <Link
              href={`/${locale}/me/messages`}
              className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
            >
              ← {t('back')}
            </Link>
            <h1 className="text-2xl text-surface">{otherName}</h1>
          </div>
          <Badge tone={thread.type === 'BOOKING' ? 'sage' : 'neutral'}>
            {t(`type.${thread.type}` as 'type.GENERAL')}
          </Badge>
        </header>

        <section className="flex flex-1 flex-col-reverse overflow-y-auto px-6 py-6 md:px-0">
          <ul className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <li className="py-12 text-center font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('empty')}
              </li>
            ) : (
              messages.map((m) => (
                <li key={m.id}>
                  <MessageBubble message={m} mine={m.senderId === session.user.id} />
                </li>
              ))
            )}
          </ul>
        </section>

        <Composer locale={locale} threadId={thread.id} />
      </main>
    </>
  );
}
