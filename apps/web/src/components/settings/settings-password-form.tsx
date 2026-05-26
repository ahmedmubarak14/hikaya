'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { updatePasswordSettingsAction } from '@/lib/settings/actions';

interface Props {
  locale: Locale;
}

export function SettingsPasswordForm({ locale }: Props) {
  const t = useTranslations('settings');
  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError(null);

    if (newPassword.length < 8) {
      setError('PASSWORD_TOO_SHORT');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('PASSWORDS_MISMATCH');
      return;
    }

    startTransition(async () => {
      const result = await updatePasswordSettingsAction(locale, newPassword);
      if (result.ok) {
        setSaved(true);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error ?? 'UNKNOWN');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5" noValidate>
      <Input
        label={t('passwordNew')}
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        hint={t('passwordHint')}
        required
      />
      <Input
        label={t('passwordConfirm')}
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      {error === 'PASSWORDS_MISMATCH' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('passwordMismatch')}
        </p>
      ) : error === 'PASSWORD_TOO_SHORT' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('passwordHint')}
        </p>
      ) : error ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('passwordError')}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" size="md" isLoading={isPending}>
          {t('passwordSave')}
        </Button>
        {saved ? (
          <span className="text-2xs text-accent-secondary">{t('passwordSaved')}</span>
        ) : null}
      </div>
    </form>
  );
}
