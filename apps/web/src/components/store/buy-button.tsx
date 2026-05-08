'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { purchaseProductAction } from '@/lib/store/actions';

interface Props {
  locale: Locale;
  username: string;
  productSlug: string;
  /** When true, switch to a "View in your purchases" affordance. */
  alreadyOwned?: boolean;
  /** When true, owner can't buy own product. */
  isOwn?: boolean;
}

export function BuyButton({ locale, username, productSlug, alreadyOwned, isOwn }: Props) {
  const t = useTranslations('store.buy');
  const [isPending, startTransition] = useTransition();

  if (isOwn) {
    return (
      <span className="rounded-full border border-surface/15 px-5 py-2 text-sm text-surface/60">
        {t('cantBuyOwn')}
      </span>
    );
  }
  if (alreadyOwned) {
    return (
      <a
        href={`/${locale}/me/purchases`}
        className="rounded-full border border-sage/40 bg-sage/10 px-5 py-2 text-sm text-sage transition-colors hover:bg-sage/20"
      >
        {t('viewInPurchases')} →
      </a>
    );
  }

  return (
    <form
      action={async () => {
        startTransition(async () => {
          await purchaseProductAction(locale, username, productSlug);
        });
      }}
    >
      <Button type="submit" size="lg" variant="primary" isLoading={isPending}>
        {t('buyNow')}
      </Button>
    </form>
  );
}
