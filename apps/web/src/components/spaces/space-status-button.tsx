'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { setSpaceStatusAction } from '@/lib/spaces/actions';
import type { SpaceStatus } from '@/lib/spaces/mock-data';

interface Props {
  locale: Locale;
  spaceId: string;
  /** Status to flip to. */
  to: SpaceStatus;
  variant?: 'primary' | 'outline' | 'destructive';
}

export function SpaceStatusButton({ locale, spaceId, to, variant = 'outline' }: Props) {
  const t = useTranslations('spaces.owner');
  const [isPending, startTransition] = useTransition();

  const labelKey: 'publish' | 'pause' | 'activate' =
    to === 'ACTIVE' ? (variant === 'primary' ? 'publish' : 'activate') : 'pause';

  return (
    <form
      action={async () => {
        startTransition(async () => {
          await setSpaceStatusAction(locale, spaceId, to);
        });
      }}
    >
      <Button type="submit" size="sm" variant={variant} isLoading={isPending}>
        {t(labelKey)}
      </Button>
    </form>
  );
}
