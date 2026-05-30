import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Bell, Inbox as InboxIcon, MessageSquare } from 'lucide-react';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { ThreadCard } from '@/components/messages/thread-card';
import {
  MarkAllReadButton,
  MarkSingleReadButton,
} from '@/components/notifications/mark-read-buttons';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getInboxData, type InboxData } from '@/lib/inbox/queries';
import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { cn } from '@/lib/utils';

import type { Metadata } from 'next';

type Tab = 'all' | 'messages' | 'inquiries' | 'notifications';
const TABS: Tab[] = ['all', 'messages', 'inquiries', 'notifications'];

interface Props {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'inbox' });
  return { title: t('title') };
}

export default async function InboxPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tab: tabParam } = IS_STATIC_EXPORT ? {} : await searchParams;
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'all';

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/inbox`);

  const t = await getTranslations('inbox');
  const data = await getInboxData(session.user, locale);

  const tabMeta: Record<Tab, { label: string; count?: number }> = {
    all: { label: t('tabs.all') },
    messages: { label: t('tabs.messages'), count: data.unread.messages || undefined },
    inquiries: { label: t('tabs.inquiries') },
    notifications: {
      label: t('tabs.notifications'),
      count: data.unread.notifications || undefined,
    },
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-surface text-3xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted mt-1 text-sm">{t('subtitle')}</p>
        </div>
        {tab === 'notifications' ? (
          <MarkAllReadButton hasUnread={data.unread.notifications > 0} />
        ) : null}
      </header>

      {/* Tab nav */}
      <nav className="border-line/60 mb-6 flex gap-1 border-b">
        {TABS.map((value) => {
          const meta = tabMeta[value];
          const active = value === tab;
          return (
            <Link
              key={value}
              href={value === 'all' ? `/${locale}/me/inbox` : `/${locale}/me/inbox?tab=${value}`}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-accent text-surface font-medium'
                  : 'text-muted hover:text-surface border-transparent',
              )}
            >
              {meta.label}
              {meta.count ? (
                <span className="bg-accent text-2xs text-ink grid h-5 min-w-5 place-items-center rounded-full px-1.5 font-mono">
                  {meta.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {tab === 'all' ? <AllFeed data={data} locale={locale} t={t} /> : null}
      {tab === 'messages' ? <MessagesTab data={data} t={t} /> : null}
      {tab === 'inquiries' ? <InquiriesTab data={data} locale={locale} t={t} /> : null}
      {tab === 'notifications' ? <NotificationsTab data={data} locale={locale} t={t} /> : null}
    </div>
  );
}

type T = Awaited<ReturnType<typeof getTranslations>>;

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-line/60 bg-paper rounded-2xl border p-10 text-center">
      <p className="text-surface text-base font-medium">{title}</p>
      <p className="text-muted mt-2 text-sm">{body}</p>
    </div>
  );
}

/* ---------------- All: merged chronological feed ---------------- */

function AllFeed({ data, locale, t }: { data: InboxData; locale: Locale; t: T }) {
  const rows: Array<{
    key: string;
    ts: number;
    href: string;
    icon: typeof Bell;
    title: string;
    body?: string;
    unread: boolean;
  }> = [];

  for (const n of data.notifications) {
    rows.push({
      key: `n-${n.id}`,
      ts: Date.parse(n.createdAt) || 0,
      href: n.href ?? `/${locale}/me/inbox?tab=notifications`,
      icon: Bell,
      title: n.title,
      body: n.body ?? undefined,
      unread: !n.readAt,
    });
  }
  for (const { thread, preview, unread, viewerSide } of data.threads) {
    const otherName = viewerSide === 'creator' ? thread.clientName : thread.creatorName;
    rows.push({
      key: `m-${thread.id}`,
      ts: thread.lastMessageAt ? Date.parse(thread.lastMessageAt) : 0,
      href: `/${locale}/me/messages/${thread.id}`,
      icon: MessageSquare,
      title: otherName,
      body: preview,
      unread: unread > 0,
    });
  }
  for (const { inquiry, direction, counterpartyName } of data.inquiries) {
    rows.push({
      key: `i-${inquiry.id}`,
      ts: Date.parse(inquiry.createdAt) || 0,
      href: `/${locale}/me/inbox?tab=inquiries`,
      icon: InboxIcon,
      title:
        direction === 'received'
          ? t('inquiryReceivedTitle')
          : t('inquirySentTitle', { name: counterpartyName ?? '' }),
      body: inquiry.description,
      unread: false,
    });
  }

  rows.sort((a, b) => b.ts - a.ts);

  if (rows.length === 0) {
    return <EmptyCard title={t('emptyTitle')} body={t('emptyBody')} />;
  }

  return (
    <ul className="border-line/60 divide-line/60 divide-y rounded-2xl border bg-paper">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <li key={row.key}>
            <Link href={row.href} className="hover:bg-surface/[0.03] block transition-colors">
              <div className="flex items-start gap-3 p-4">
                <span
                  className={cn(
                    'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full',
                    row.unread ? 'bg-accent/15 text-accent' : 'bg-surface/[0.05] text-muted',
                  )}
                >
                  <Icon size={15} strokeWidth={1.75} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      'truncate text-sm',
                      row.unread ? 'text-surface font-medium' : 'text-surface/80',
                    )}
                  >
                    {row.title}
                  </span>
                  {row.body ? (
                    <span className="text-muted line-clamp-1 mt-0.5 text-xs">{row.body}</span>
                  ) : null}
                  <span className="text-muted/70 mt-1 text-2xs">
                    {relativeLabel(row.ts, locale)}
                  </span>
                </div>
                {row.unread ? (
                  <span aria-hidden className="bg-accent mt-2 h-2 w-2 shrink-0 rounded-full" />
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- Messages ---------------- */

function MessagesTab({ data, t }: { data: InboxData; t: T }) {
  if (data.threads.length === 0) {
    return <EmptyCard title={t('messagesEmptyTitle')} body={t('messagesEmptyBody')} />;
  }
  return (
    <ul className="flex flex-col gap-3">
      {data.threads.map(({ thread, preview, unread, viewerSide }) => (
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
  );
}

/* ---------------- Inquiries ---------------- */

const STATUS_TONE: Record<string, 'neutral' | 'accent' | 'sage' | 'warning'> = {
  PENDING: 'accent',
  ACCEPTED: 'sage',
  DECLINED: 'warning',
  EXPIRED: 'neutral',
};

function InquiriesTab({ data, locale, t }: { data: InboxData; locale: Locale; t: T }) {
  if (data.inquiries.length === 0) {
    return <EmptyCard title={t('inquiriesEmptyTitle')} body={t('inquiriesEmptyBody')} />;
  }
  return (
    <ul className="flex flex-col gap-3">
      {data.inquiries.map(({ inquiry, direction, counterpartyName, counterpartyUsername }) => (
        <li key={inquiry.id}>
          <Card>
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between md:gap-6">
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Badge tone={direction === 'received' ? 'accent' : 'neutral'}>
                    {direction === 'received' ? t('received') : t('sent')}
                  </Badge>
                  {direction === 'sent' && counterpartyName ? (
                    <Link
                      href={`/${locale}/${counterpartyUsername}`}
                      className="text-surface text-sm underline-offset-4 hover:underline"
                    >
                      {counterpartyName}
                    </Link>
                  ) : null}
                </div>
                <p className="text-surface/60 line-clamp-2 max-w-prose text-sm">
                  {inquiry.description}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge tone={STATUS_TONE[inquiry.status] ?? 'neutral'}>
                  {t(`status.${inquiry.status}` as 'status.PENDING')}
                </Badge>
                <span className="text-2xs text-surface/40 font-mono">
                  {relativeLabel(Date.parse(inquiry.createdAt) || 0, locale)}
                </span>
              </div>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Notifications ---------------- */

function NotificationsTab({ data, locale, t }: { data: InboxData; locale: Locale; t: T }) {
  if (data.notifications.length === 0) {
    return <EmptyCard title={t('notificationsEmptyTitle')} body={t('notificationsEmptyBody')} />;
  }
  return (
    <ul className="border-line/60 divide-line/60 divide-y rounded-2xl border bg-paper">
      {data.notifications.map((n) => {
        const isUnread = !n.readAt;
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
                  className={cn('text-sm', isUnread ? 'text-surface font-medium' : 'text-surface/80')}
                >
                  {n.title}
                </span>
                {n.body ? (
                  <span className="text-muted mt-0.5 text-xs leading-relaxed">{n.body}</span>
                ) : null}
                <span className="text-muted/70 mt-1 text-2xs">
                  {relativeLabel(Date.parse(n.createdAt) || 0, locale)}
                </span>
              </div>
            </div>
            {isUnread ? <MarkSingleReadButton notificationId={n.id} /> : null}
          </div>
        );
        return n.href ? (
          <li key={n.id}>
            <Link href={n.href} className="hover:bg-surface/[0.03] block transition-colors">
              {inner}
            </Link>
          </li>
        ) : (
          <li key={n.id}>{inner}</li>
        );
      })}
    </ul>
  );
}

/* ---------------- shared ---------------- */

function relativeLabel(ts: number, locale: Locale): string {
  if (!ts) return '';
  const diffMin = Math.round((Date.now() - ts) / 60_000);
  if (diffMin < 1) return locale === 'ar' ? 'الآن' : 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d`;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(ts));
}
