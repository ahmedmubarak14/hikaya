'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { createGalleryAction, type GalleryResult } from '@/lib/galleries/actions';
import { createGallerySchema, type CreateGalleryValues } from '@/lib/galleries/schemas';

interface Props {
  locale: Locale;
}

export function CreateGalleryForm({ locale }: Props) {
  const t = useTranslations('gallery.create.form');

  const [serverState, formAction] = useFormState<GalleryResult | null, FormData>(
    createGalleryAction.bind(null, locale),
    null,
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGalleryValues>({
    resolver: zodResolver(createGallerySchema),
    defaultValues: {
      titleEn: '',
      titleAr: '',
      message: '',
      coverUrl: '',
      allowDownloads: true,
      watermarkPreviews: false,
      expiresInDays: 30,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('titleEn', values.titleEn);
        if (values.titleAr) fd.set('titleAr', values.titleAr);
        if (values.message) fd.set('message', values.message);
        if (values.coverUrl) fd.set('coverUrl', values.coverUrl);
        if (values.allowDownloads) fd.set('allowDownloads', 'on');
        if (values.watermarkPreviews) fd.set('watermarkPreviews', 'on');
        if (values.expiresInDays) fd.set('expiresInDays', String(values.expiresInDays));
        startTransition(() => formAction(fd));
      })}
      className="flex flex-col gap-5"
      noValidate
    >
      <Input
        label={t('titleEn')}
        {...register('titleEn')}
        error={errors.titleEn?.message}
        required
      />
      <Input label={t('titleAr')} {...register('titleAr')} error={errors.titleAr?.message} />

      <label className="flex flex-col gap-1.5">
        <span className="text-surface/80 [lang=ar]:font-sansAr text-sm font-medium">
          {t('message')}
        </span>
        <textarea
          rows={3}
          {...register('message')}
          placeholder={t('messagePlaceholder')}
          className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-base outline-none"
        />
        <span className="text-surface/50 text-xs">{t('messageHint')}</span>
      </label>

      <Input
        label={t('coverUrl')}
        hint={t('coverUrlHint')}
        placeholder="https://..."
        {...register('coverUrl')}
        error={errors.coverUrl?.message}
      />

      <Input
        type="number"
        inputMode="numeric"
        label={t('expiresInDays')}
        hint={t('expiresInDaysHint')}
        {...register('expiresInDays')}
        error={errors.expiresInDays?.message}
      />

      <div className="border-surface/10 bg-surface/[0.03] flex flex-col gap-3 rounded-md border p-4">
        <label className="text-surface/80 flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            {...register('allowDownloads')}
            className="accent-accent mt-0.5 h-4 w-4"
          />
          <span>
            <span className="text-surface block font-medium">{t('allowDownloads')}</span>
            <span className="text-surface/50 block text-xs">{t('allowDownloadsHint')}</span>
          </span>
        </label>
        <label className="text-surface/80 flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            {...register('watermarkPreviews')}
            className="accent-accent mt-0.5 h-4 w-4"
          />
          <span>
            <span className="text-surface block font-medium">{t('watermarkPreviews')}</span>
            <span className="text-surface/50 block text-xs">{t('watermarkPreviewsHint')}</span>
          </span>
        </label>
      </div>

      {serverState?.error && serverState.error !== 'INVALID_INPUT' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('errorGeneric')}
        </p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isPending} className="self-start">
        {t('submit')}
      </Button>
    </form>
  );
}
