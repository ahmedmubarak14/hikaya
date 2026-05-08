'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { cancelContractAction } from '@/lib/contracts/actions';
import { type Locale } from '@/i18n/config';

interface Props {
  locale: Locale;
  contractId: string;
}

export function CancelContractButton({ locale, contractId }: Props) {
  const t = useTranslations('contracts.detail');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={async () => {
        startTransition(async () => {
          await cancelContractAction(locale, contractId);
        });
      }}
    >
      <Button
        type="submit"
        size="sm"
        variant="destructive"
        isLoading={isPending}
        onClick={(e) => {
          if (!confirm(t('cancelConfirm'))) e.preventDefault();
        }}
      >
        {t('cancelContract')}
      </Button>
    </form>
  );
}
