'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { resetPasswordAction } from '@/lib/auth/actions';

interface Props {
  locale: Locale;
}

export function ResetPasswordForm({ locale }: Props) {
  const t = useTranslations('auth');
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('PASSWORD_TOO_SHORT');
      return;
    }
    if (password !== confirmPassword) {
      setError('PASSWORDS_MISMATCH');
      return;
    }

    startTransition(async () => {
      const result = await resetPasswordAction(locale, password);
      if (!result.ok) {
        setError(result.error ?? 'UNKNOWN');
      }
      // On success the server action redirects to /sign-in
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5" noValidate>
      <Input
        label={t('newPassword')}
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint={t('passwordHint')}
        required
      />
      <Input
        label={t('confirmPassword')}
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      {error === 'PASSWORDS_MISMATCH' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('resetPasswordMismatch')}
        </p>
      ) : error === 'PASSWORD_TOO_SHORT' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('passwordHint')}
        </p>
      ) : error ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('resetPasswordError')}
        </p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isPending} className="mt-2">
        {t('resetPasswordCta')}
      </Button>
    </form>
  );
}
