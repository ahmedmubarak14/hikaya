'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { addImagesAction, type GalleryResult } from '@/lib/galleries/actions';

interface Props {
  locale: Locale;
  galleryId: string;
}

export function AddImagesForm({ locale, galleryId }: Props) {
  const t = useTranslations('gallery.addImages');
  const [serverState, formAction] = useFormState<GalleryResult | null, FormData>(
    addImagesAction.bind(null, locale, galleryId),
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState('');

  return (
    <form
      action={(fd) => {
        startTransition(() => {
          formAction(fd);
          setValue('');
        });
      }}
      className="flex flex-col gap-3 rounded-xl border border-surface/10 bg-surface/[0.03] p-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-surface/80 [lang=ar]:font-sansAr">
          {t('label')}
        </span>
        <textarea
          name="urls"
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('placeholder')}
          className="rounded-md border border-surface/15 bg-surface/5 px-3 py-2 font-mono text-sm text-surface outline-none focus-visible:border-accent"
        />
        <span className="text-xs text-surface/50">{t('hint')}</span>
      </label>

      {serverState?.ok ? (
        <p className="text-2xs text-accent-secondary">
          {t('added')}
        </p>
      ) : serverState?.error === 'INVALID_INPUT' ? (
        <p className="text-xs text-accent-secondary">
          {serverState.fieldErrors?.urls ?? t('invalid')}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" isLoading={isPending}>
          {t('submit')}
        </Button>
      </div>
    </form>
  );
}
