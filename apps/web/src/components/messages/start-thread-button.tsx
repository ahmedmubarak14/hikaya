'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { startThreadAction, type MessageResult } from '@/lib/messages/actions';

interface Props {
  locale: Locale;
  creatorUsername: string;
  /** Caption fallbacks if the user is signed-out / hits the action's auth guard. */
}

/**
 * Public-profile "Message" CTA. Opens an inline composer so the visitor can
 * send a first note in one step. The action handles auth (redirects to sign-in
 * with `next` set), creator lookup, self-message guard, and thread re-use.
 */
export function StartThreadButton({ locale, creatorUsername }: Props) {
  const t = useTranslations('messages.start');
  const [open, setOpen] = useState(false);
  const [serverState, formAction] = useFormState<MessageResult | null, FormData>(
    startThreadAction.bind(null, locale),
    null,
  );
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" size="md" variant="outline" onClick={() => setOpen(true)}>
        {t('cta')}
      </Button>
    );
  }

  return (
    <form
      action={(fd) => {
        startTransition(() => formAction(fd));
      }}
      className="border-surface/15 bg-surface/[0.03] flex w-full max-w-xl flex-col gap-3 rounded-xl border p-4"
    >
      <input type="hidden" name="creatorUsername" value={creatorUsername} />
      <label className="flex flex-col gap-1.5">
        <span className="text-surface/80 [lang=ar]:font-sansAr text-sm font-medium">
          {t('label')}
        </span>
        <textarea
          name="body"
          rows={3}
          placeholder={t('placeholder')}
          className="border-surface/15 bg-bg/40 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-base outline-none"
        />
      </label>

      {serverState?.error === 'CANNOT_MESSAGE_SELF' ? (
        <p className="text-accent-secondary text-xs">{t('errorSelf')}</p>
      ) : serverState?.error === 'CREATOR_HAS_NO_USER' ? (
        <p className="text-accent-secondary text-xs">{t('errorNoUser')}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" variant="primary" isLoading={isPending}>
          {t('send')}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-surface/60 hover:text-surface rounded-full px-3 py-2 text-sm transition-colors"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}
