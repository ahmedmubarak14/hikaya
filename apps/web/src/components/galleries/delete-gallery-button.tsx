'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { deleteGalleryAction } from '@/lib/galleries/actions';

interface Props {
  locale: Locale;
  galleryId: string;
}

/**
 * confirm()-gated delete. The button's onClick short-circuits the submission
 * via preventDefault() if the user backs out — cheap protection against
 * fat-fingering, since the manager page is one click away from destroying
 * real client work. The action redirects on success.
 */
export function DeleteGalleryButton({ locale, galleryId }: Props) {
  const t = useTranslations('gallery.manage');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={async () => {
        startTransition(async () => {
          await deleteGalleryAction(locale, galleryId);
        });
      }}
    >
      <Button
        type="submit"
        size="sm"
        variant="destructive"
        isLoading={isPending}
        onClick={(e) => {
          if (!confirm(t('deleteConfirm'))) e.preventDefault();
        }}
      >
        {t('delete')}
      </Button>
    </form>
  );
}
