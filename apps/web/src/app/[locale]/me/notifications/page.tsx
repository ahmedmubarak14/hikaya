import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  MarkAllReadButton,
  MarkSingleReadButton,
} from '@/components/notifications/mark-read-buttons';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { listMyNotifications, type NotificationRow } from '@/lib/notifications/queries';
import { cn } from '@/lib/utils';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'notifications' });
  return { title: t('title') };
}

export default async function NotificationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/notifications`);

  const t = await getTranslations('notifications');
  const items = await listMyNotifications(session.user.id, locale, 100);
  const unreadCount = items.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-surface text-3xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted mt-1 text-sm">
            {unreadCount > 0 ? t('unreadCount', { n: unreadCount }) : t('allCaughtUp')}
          </p>
        </div>
        <MarkAllReadButton hasUnread={unreadCount > 0} />
      </header>

      {items.length === 0 ? (
        <div className="border-line/60 bg-paper rounded-2xl border p-10 text-center">
          <p className="text-surface text-base font-medium">{t('emptyTitle')}</p>
          <p className="text-muted mt-2 text-sm">{t('emptyBody')}</p>
        </div>
      ) : (
        <ul className="border-line/60 divide-line/60 divide-y rounded-2xl border bg-paper">
          {items.map((n) => (
            <NotificationItem key={n.id} notification={n} relativeLabel={relativeLabel(n.createdAt, locale)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  relativeLabel,
}: {
  notification: NotificationRow;
  relativeLabel: string;
}) {
  const isUnread = !notification.readAt;
  const inner = (
    <div className="flex items-start justify-between gap-3 p-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          aria-hidden
          className={cn(
            'mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full',
            isUnread ? 'bg-accent' : 'bg-transparent',
          )}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              'text-sm',
              isUnread ? 'text-surface font-medium' : 'text-surface/80',
            )}
          >
            {notification.title}
          </span>
          {notification.body ? (
            <span className="text-muted mt-0.5 text-xs leading-relaxed">{notification.body}</span>
          ) : null}
          <span className="text-muted/70 mt-1 text-2xs">{relativeLabel}</span>
        </div>
      </div>
      {isUnread ? <MarkSingleReadButton notificationId={notification.id} /> : null}
    </div>
  );

  if (notification.href) {
    return (
      <li>
        <Link href={notification.href} className="hover:bg-surface/[0.03] block transition-colors">
          {inner}
        </Link>
      </li>
    );
  }
  return <li>{inner}</li>;
}

function relativeLabel(iso: string, locale: Locale): string {
  const now = Date.now();
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '';
  const diffMin = Math.round((now - then) / 60_000);
  if (diffMin < 1) return locale === 'ar' ? 'الآن' : 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d`;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}
