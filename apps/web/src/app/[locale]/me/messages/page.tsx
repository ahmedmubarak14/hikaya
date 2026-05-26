import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { EmptyState } from '@/components/empty-state';
import { ThreadCard } from '@/components/messages/thread-card';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMessagesByThread, listThreadsForUser } from '@/lib/messages/queries';
import { countUnreadFor } from '@/lib/messages/mock-store';

import type { Metadata } from 'next';

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

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/messages`);

  const t = await getTranslations('messages.list');
  const threads = await listThreadsForUser(session.user.id);

  // Pre-fetch last message for each thread
  const threadPreviews = await Promise.all(
    threads.map(async (thread) => {
      const messages = await getMessagesByThread(thread.id);
      const last = messages[messages.length - 1];
      const viewerSide: 'creator' | 'client' =
        thread.creatorUserId === session.user.id ? 'creator' : 'client';
      const unread = countUnreadFor(thread, session.user.id);
      return { thread, preview: last?.body, unread, viewerSide };
    }),
  );

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-4xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="text-accent-secondary font-bold">{t('headlineItalic')}</span>
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        {threadPreviews.length === 0 ? (
          <EmptyState
            title={t('empty')}
            subtitle={t('emptySubtitle')}
            ctaLabel={t('discoverCta')}
            ctaHref={`/${locale}/discover`}
            icon={'\u{1F4AC}'}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {threadPreviews.map(({ thread, preview, unread, viewerSide }) => (
              <li key={thread.id}>
                <ThreadCard
                  thread={thread}
                  preview={preview}
                  unreadCount={unread}
                  viewerSide={viewerSide}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
