'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition, type FormEvent } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { sendMessageAction } from '@/lib/messages/actions';

interface Props {
  locale: Locale;
  threadId: string;
}

/**
 * Message composer. Auto-resizes; submit on Cmd/Ctrl+Enter or click. Optimistic
 * clear so the next send feels immediate; the action revalidates the thread
 * route which causes the new bubble to render in place.
 */
export function Composer({ locale, threadId }: Props) {
  const t = useTranslations('messages.composer');
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    const fd = new FormData();
    fd.set('body', trimmed);
    setValue('');
    startTransition(async () => {
      await sendMessageAction(locale, threadId, null, fd);
    });
  };

  return (
    <form
      onSubmit={submit}
      className="border-surface/10 bg-bg/85 flex items-end gap-2 border-t p-4 backdrop-blur-md"
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          // Auto-grow up to ~6 lines.
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
      <Button type="submit" size="md" isLoading={isPending} disabled={!value.trim()}>
        {t('send')}
      </Button>
    </form>
  );
}
