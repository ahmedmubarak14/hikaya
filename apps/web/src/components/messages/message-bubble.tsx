import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import type { Message } from '@/lib/messages/mock-data';
import { ReportButton } from '@/components/moderation/report-button';

interface Props {
  message: Message;
  /** True when the signed-in viewer authored this message. */
  mine: boolean;
}

/**
 * Returns the status icon(s) for a sent message.
 * - SENT: single check
 * - DELIVERED: double check (grey)
 * - READ: double check (accent-tinted)
 */
function StatusIndicator({ status }: { status: Message['status'] }) {
  const t = useTranslations('messages.bubble');

  if (status === 'READ') {
    return (
      <span aria-label={t('status.READ')} className="text-accent/80">
        {'✓✓'}
      </span>
    );
  }

  if (status === 'DELIVERED') {
    return (
      <span aria-label={t('status.DELIVERED')}>
        {'✓✓'}
      </span>
    );
  }

  return (
    <span aria-label={t('status.SENT')}>
      {'✓'}
    </span>
  );
}

export function MessageBubble({ message, mine }: Props) {
  const locale = useLocale() as Locale;

  return (
    <div className={cn('group flex w-full', mine ? 'justify-end' : 'justify-start')}>
      <div className="flex items-end gap-1">
        {!mine ? (
          <span className="opacity-0 transition-opacity group-hover:opacity-100">
            <ReportButton
              resourceType="MESSAGE"
              resourceId={message.id}
              className="text-[10px]"
            />
          </span>
        ) : null}
        <div
          className={cn(
            'max-w-[75%] rounded-2xl px-4 py-2.5 text-base',
            mine
              ? 'bg-accent text-ink rounded-ee-sm'
              : 'bg-surface/[0.06] text-surface rounded-es-sm',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
          <div
            className={cn(
              'text-2xs mt-1 flex items-center justify-end gap-1.5 font-mono',
              mine ? 'text-ink/60' : 'text-surface/40',
            )}
          >
            <time dateTime={message.createdAt}>
              {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
                hour: 'numeric',
                minute: '2-digit',
              }).format(new Date(message.createdAt))}
            </time>
            {mine ? <StatusIndicator status={message.status} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
