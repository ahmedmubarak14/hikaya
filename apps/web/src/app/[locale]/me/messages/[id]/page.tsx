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

import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { DemoModeNotice } from '@/components/demo-mode-notice';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

// Auth-gated route — generate one placeholder per locale so Next has
// something to render; the page itself short-circuits to DemoModeNotice
// when EXPORT=1, so the placeholder id is never actually used.
export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  return locales.map((locale) => ({ locale, id: '_demo' }));
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
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

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
  const otherName =
    thread.creatorUserId === session.user.id ? thread.clientName : thread.creatorName;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col px-0 md:px-6">
        <header className="border-surface/10 flex items-baseline justify-between gap-3 border-b px-6 py-5 md:px-0">
          <div className="flex flex-col gap-1.5">
            <Link
              href={`/${locale}/me/messages`}
              className="text-2xs text-surface/40 hover:text-surface transition-colors"
            >
              ← {t('back')}
            </Link>
            <h1 className="text-surface text-2xl">{otherName}</h1>
          </div>
          <Badge tone={thread.type === 'BOOKING' ? 'sage' : 'neutral'}>
            {t(`type.${thread.type}` as 'type.GENERAL')}
          </Badge>
        </header>

        <section className="flex flex-1 flex-col-reverse overflow-y-auto px-6 py-6 md:px-0">
          <ul className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <li className="text-2xs text-surface/40 py-12 text-center">{t('empty')}</li>
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
