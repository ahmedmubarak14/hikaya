'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { setProductStatusAction } from '@/lib/store/actions';
import type { ProductStatus } from '@/lib/store/mock-data';

interface Props {
  locale: Locale;
  productId: string;
  /** Status to flip to. */
  to: ProductStatus;
  variant?: 'primary' | 'outline' | 'destructive';
  confirmKey?: string;
}

export function StatusButton({ locale, productId, to, variant = 'outline', confirmKey }: Props) {
  const t = useTranslations('store.detail');
  const [isPending, startTransition] = useTransition();

  const labelKey =
    to === 'ACTIVE' ? 'publish' : to === 'DRAFT' ? 'unpublish' : 'archive';

  return (
    <form
      action={async () => {
        startTransition(async () => {
          await setProductStatusAction(locale, productId, to);
        });
      }}
    >
      <Button
        type="submit"
        size="sm"
        variant={variant}
        isLoading={isPending}
        onClick={(e) => {
          if (confirmKey && !confirm(t(confirmKey as 'archiveConfirm'))) e.preventDefault();
        }}
      >
        {t(labelKey as 'publish')}
      </Button>
    </form>
  );
}
