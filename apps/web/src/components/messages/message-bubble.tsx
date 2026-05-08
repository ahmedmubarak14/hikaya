import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import type { Message } from '@/lib/messages/mock-data';

interface Props {
  message: Message;
  /** True when the signed-in viewer authored this message. */
  mine: boolean;
}

export function MessageBubble({ message, mine }: Props) {
  const t = useTranslations('messages.bubble');
  const locale = useLocale() as Locale;

  return (
    <div className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}>
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
            'mt-1 flex items-center justify-end gap-1.5 font-mono text-2xs',
            mine ? 'text-ink/60' : 'text-surface/40',
          )}
        >
          <time dateTime={message.createdAt}>
            {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date(message.createdAt))}
          </time>
          {mine ? (
            <span aria-label={t(`status.${message.status}` as 'status.SENT')}>
              {message.status === 'READ' ? '✓✓' : '✓'}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
