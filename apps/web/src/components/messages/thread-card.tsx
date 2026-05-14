import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { Card, CardBody, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import type { Thread } from '@/lib/messages/mock-data';

interface Props {
  thread: Thread;
  /** Last message body, for preview. */
  preview?: string;
  unreadCount: number;
  /** Which side the viewer is on — controls the "other party" label. */
  viewerSide: 'creator' | 'client';
}

export function ThreadCard({ thread, preview, unreadCount, viewerSide }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations('messages.list');

  const otherName = viewerSide === 'creator' ? thread.clientName : thread.creatorName;
  const otherInitial = otherName.charAt(0).toUpperCase();

  return (
    <Link href={`/${locale}/me/messages/${thread.id}`} className="block">
      <Card interactive className={cn(unreadCount > 0 && 'border-accent/40 bg-accent/5')}>
        <CardBody className="flex items-center gap-4 p-5">
          <span
            aria-hidden
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent/20 font-display text-xl text-accent-secondary"
          >
            {otherInitial}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-base text-surface">{otherName}</span>
              {thread.lastMessageAt ? (
                <span className="shrink-0 text-2xs text-surface/40">
                  {formatRelative(thread.lastMessageAt, locale)}
                </span>
              ) : null}
            </div>
            <p className="line-clamp-1 text-sm text-surface/60">
              {preview ?? t('noPreview')}
            </p>
          </div>
          {unreadCount > 0 ? (
            <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-accent px-1.5 font-mono text-2xs text-ink">
              {unreadCount}
            </span>
          ) : null}
        </CardBody>
      </Card>
    </Link>
  );
}

function formatRelative(iso: string, locale: Locale): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  const fmt = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', { numeric: 'auto' });
  if (diffMin < 60) return fmt.format(-Math.max(1, diffMin), 'minute');
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return fmt.format(-diffHr, 'hour');
  const diffDay = Math.round(diffHr / 24);
  return fmt.format(-diffDay, 'day');
}
