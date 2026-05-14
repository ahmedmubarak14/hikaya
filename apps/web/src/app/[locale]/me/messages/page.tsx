import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { ThreadCard } from '@/components/messages/thread-card';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import {
  countUnreadFor,
  getMessagesByThread,
  listThreadsForUser,
} from '@/lib/messages/mock-store';

import type { Metadata } from 'next';

import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { DemoModeNotice } from '@/components/demo-mode-notice';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'messages.list' });
  return { title: t('title') };
}

export default async function MyMessagesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/messages`);

  const t = await getTranslations('messages.list');
  const threads = listThreadsForUser(session.user.id);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-6 py-22 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">{t('eyebrow')}</Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="font-bold text-accent-secondary">{t('headlineItalic')}</span>
          </h1>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
        </header>

        {threads.length === 0 ? (
          <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-10 text-center">
            <p className="text-lg text-surface/70">{t('empty')}</p>
            <p className="mt-2 text-sm text-surface/40">{t('emptyHint')}</p>
            <Link
              href={`/${locale}/discover`}
              className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02]"
            >
              {t('discoverCta')}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {threads.map((thread) => {
              const messages = getMessagesByThread(thread.id);
              const last = messages[messages.length - 1];
              const viewerSide = thread.creatorUserId === session.user.id ? 'creator' : 'client';
              const unread = countUnreadFor(thread, session.user.id);
              return (
                <li key={thread.id}>
                  <ThreadCard
                    thread={thread}
                    preview={last?.body}
                    unreadCount={unread}
                    viewerSide={viewerSide}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
