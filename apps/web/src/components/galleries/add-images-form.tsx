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
      className="border-surface/10 bg-surface/[0.03] flex flex-col gap-3 rounded-xl border p-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-surface/80 [lang=ar]:font-sansAr text-sm font-medium">
          {t('label')}
        </span>
        <textarea
          name="urls"
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('placeholder')}
          className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 font-mono text-sm outline-none"
        />
        <span className="text-surface/50 text-xs">{t('hint')}</span>
      </label>

      {serverState?.ok ? (
        <p className="text-2xs text-accent-secondary">{t('added')}</p>
      ) : serverState?.error === 'INVALID_INPUT' ? (
        <p className="text-accent-secondary text-xs">
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
