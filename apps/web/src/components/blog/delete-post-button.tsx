'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { deletePostAction } from '@/lib/blog/actions';

interface Props {
  locale: Locale;
  postId: string;
}

export function DeletePostButton({ locale, postId }: Props) {
  const t = useTranslations('blog.owner');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={async () => {
        if (!confirm(t('deleteConfirm'))) return;
        startTransition(async () => {
          await deletePostAction(locale, postId);
        });
      }}
    >
      <Button type="submit" size="sm" variant="outline" isLoading={isPending}>
        {t('delete')}
      </Button>
    </form>
  );
}
