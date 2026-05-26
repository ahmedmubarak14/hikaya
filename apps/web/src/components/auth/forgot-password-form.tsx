'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { forgotPasswordAction } from '@/lib/auth/actions';

interface Props {
  locale: Locale;
}

export function ForgotPasswordForm({ locale }: Props) {
  const t = useTranslations('auth');
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    startTransition(async () => {
      const result = await forgotPasswordAction(locale, email);
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error ?? 'UNKNOWN');
      }
    });
  };

  if (sent) {
    return (
      <div className="border-accent/40 bg-accent/10 rounded-lg border p-5">
        <p className="text-surface text-base">{t('forgotPasswordSuccess')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5" noValidate>
      <Input
        label={t('email')}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {error ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('forgotPasswordError')}
        </p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isPending} className="mt-2">
        {t('forgotPasswordCta')}
      </Button>
    </form>
  );
}
