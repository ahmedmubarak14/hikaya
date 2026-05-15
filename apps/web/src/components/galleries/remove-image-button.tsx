'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { type Locale } from '@/i18n/config';
import { removeImageAction } from '@/lib/galleries/actions';

interface Props {
  locale: Locale;
  galleryId: string;
  imageId: string;
}

export function RemoveImageButton({ locale, galleryId, imageId }: Props) {
  const t = useTranslations('gallery.manage');
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          void removeImageAction(locale, galleryId, imageId);
        })
      }
      className="bg-accent-secondary text-2xs text-surface rounded-full px-3 py-1 font-medium transition-transform hover:scale-105 disabled:opacity-50"
    >
      {t('removeImage')}
    </button>
  );
}
