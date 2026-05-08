'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { signOutAction } from '@/lib/auth/actions';

interface Props {
  locale: Locale;
}

export function SignOutButton({ locale }: Props) {
  const t = useTranslations('auth');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(() => {
          void signOutAction(locale);
        });
      }}
    >
      <Button type="submit" variant="outline" size="sm" isLoading={isPending}>
        {t('signOut')}
      </Button>
    </form>
  );
}
