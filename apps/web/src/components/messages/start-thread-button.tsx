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
      className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-surface/15 bg-surface/[0.03] p-4"
    >
      <input type="hidden" name="creatorUsername" value={creatorUsername} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-surface/80 [lang=ar]:font-sansAr">
          {t('label')}
        </span>
        <textarea
          name="body"
          rows={3}
          placeholder={t('placeholder')}
          className="rounded-md border border-surface/15 bg-bg/40 px-3 py-2 text-base text-surface outline-none focus-visible:border-accent"
        />
      </label>

      {serverState?.error === 'CANNOT_MESSAGE_SELF' ? (
        <p className="text-xs text-accent-secondary">{t('errorSelf')}</p>
      ) : serverState?.error === 'CREATOR_HAS_NO_USER' ? (
        <p className="text-xs text-accent-secondary">{t('errorNoUser')}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" variant="primary" isLoading={isPending}>
          {t('send')}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-3 py-2 text-sm text-surface/60 transition-colors hover:text-surface"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}
