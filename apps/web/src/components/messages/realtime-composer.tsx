'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition, type FormEvent } from 'react';

import { Button, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { sendMessageAction } from '@/lib/messages/actions';

import { useTypingBroadcast } from './typing-indicator';

interface Props {
  locale: Locale;
  threadId: string;
  currentUserId: string;
}

/**
 * Enhanced message composer with typing broadcast and attachment URL support.
 * Replaces the original Composer for the real-time thread view.
 */
export function RealtimeComposer({ locale, threadId, currentUserId }: Props) {
  const t = useTranslations('messages.composer');
  const [value, setValue] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [showAttachInput, setShowAttachInput] = useState(false);
  const [attachUrl, setAttachUrl] = useState('');
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);
  const { broadcastTyping } = useTypingBroadcast(threadId, currentUserId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed && attachmentUrls.length === 0) return;

    const fd = new FormData();
    fd.set('body', trimmed || (attachmentUrls.length > 0 ? t('attachmentMessage') : ''));
    if (attachmentUrls.length > 0) {
      fd.set('attachmentUrls', JSON.stringify(attachmentUrls));
    }
    setValue('');
    setAttachmentUrls([]);
    setShowAttachInput(false);
    startTransition(async () => {
      await sendMessageAction(locale, threadId, null, fd);
    });
  };

  const addAttachment = () => {
    const trimmedUrl = attachUrl.trim();
    if (!trimmedUrl) return;
    try {
      new URL(trimmedUrl); // Validate URL
      setAttachmentUrls((prev) => [...prev, trimmedUrl]);
      setAttachUrl('');
    } catch {
      // Invalid URL — ignore
    }
  };

  const removeAttachment = (index: number) => {
    setAttachmentUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-surface/10 bg-bg/85 border-t backdrop-blur-md">
      {/* Attachment previews */}
      {attachmentUrls.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-b border-surface/5 px-4 py-2">
          {attachmentUrls.map((url, i) => (
            <span
              key={`${url}-${i}`}
              className="bg-surface/10 text-surface/70 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
            >
              <span className="max-w-[120px] truncate">{url.split('/').pop() || url}</span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-surface/40 hover:text-surface transition-colors"
                aria-label={t('removeAttachment')}
              >
                x
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {/* Attachment URL input */}
      {showAttachInput ? (
        <div className="flex items-center gap-2 border-b border-surface/5 px-4 py-2">
          <input
            type="url"
            value={attachUrl}
            onChange={(e) => setAttachUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAttachment();
              }
            }}
            placeholder={t('attachUrlPlaceholder')}
            className="border-surface/15 bg-surface/5 text-surface placeholder:text-surface/40 focus-visible:border-accent flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
          />
          <button
            type="button"
            onClick={addAttachment}
            className="text-accent hover:text-accent/80 text-sm font-medium transition-colors"
          >
            {t('addAttachment')}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAttachInput(false);
              setAttachUrl('');
            }}
            className="text-surface/40 hover:text-surface text-sm transition-colors"
          >
            {t('cancelAttachment')}
          </button>
        </div>
      ) : null}

      <form onSubmit={submit} className="flex items-end gap-2 p-4">
        {/* Attach button */}
        <button
          type="button"
          onClick={() => setShowAttachInput(!showAttachInput)}
          className={cn(
            'shrink-0 rounded-full p-2 transition-colors',
            showAttachInput
              ? 'bg-accent/10 text-accent'
              : 'text-surface/40 hover:text-surface hover:bg-surface/10',
          )}
          aria-label={t('attach')}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
            />
          </svg>
        </button>

        <textarea
          ref={ref}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            broadcastTyping();
            // Auto-grow up to ~6 lines
            const el = e.target as HTMLTextAreaElement;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              submit(e);
            }
          }}
          placeholder={t('placeholder')}
          rows={1}
          className="border-surface/15 bg-surface/5 text-surface placeholder:text-surface/40 focus-visible:border-accent flex-1 resize-none rounded-2xl border px-4 py-2.5 text-base outline-none"
        />
        <Button
          type="submit"
          size="md"
          isLoading={isPending}
          disabled={!value.trim() && attachmentUrls.length === 0}
        >
          {t('send')}
        </Button>
      </form>
    </div>
  );
}
