'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { publishPostAction } from '@/lib/blog/actions';

interface Props {
  locale: Locale;
  postId: string;
  /** Current status — drives the action and the label. */
  status: 'DRAFT' | 'PUBLISHED';
}

export function PublishPostButton({ locale, postId, status }: Props) {
  const t = useTranslations('blog.owner');
  const [isPending, startTransition] = useTransition();

  const isPublished = status === 'PUBLISHED';

  return (
    <form
      action={async () => {
        startTransition(async () => {
          await publishPostAction(locale, postId, !isPublished);
        });
      }}
    >
      <Button
        type="submit"
        size="sm"
        variant={isPublished ? 'outline' : 'primary'}
        isLoading={isPending}
      >
        {isPublished ? t('unpublish') : t('publish')}
      </Button>
    </form>
  );
}
