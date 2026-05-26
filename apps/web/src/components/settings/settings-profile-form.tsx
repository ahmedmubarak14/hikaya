'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { updateProfileSettingsAction } from '@/lib/settings/actions';

interface Props {
  locale: Locale;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    locale: string;
  };
}

export function SettingsProfileForm({ locale, user }: Props) {
  const t = useTranslations('settings');
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [preferredLocale, setPreferredLocale] = useState(user.locale);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateProfileSettingsAction(locale, {
        displayName,
        avatarUrl: avatarUrl || null,
        locale: preferredLocale as 'en' | 'ar',
      });
      if (result.ok) {
        setSaved(true);
      } else {
        setError(result.error ?? 'UNKNOWN');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5" noValidate>
      <Input
        label={t('profileDisplayName')}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
      />

      <Input label={t('profileEmail')} value={user.email} disabled />

      <Input
        label={t('profileAvatarUrl')}
        type="url"
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        hint={t('profileAvatarHint')}
      />

      <label className="flex w-full flex-col gap-1.5">
        <span className="text-surface/80 text-sm font-medium">{t('profileLocale')}</span>
        <select
          value={preferredLocale}
          onChange={(e) => setPreferredLocale(e.target.value)}
          className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-11 rounded-md border px-3 text-base outline-none"
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </label>

      {error ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('profileError')}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" size="md" isLoading={isPending}>
          {t('profileSave')}
        </Button>
        {saved ? <span className="text-2xs text-accent-secondary">{t('profileSaved')}</span> : null}
      </div>
    </form>
  );
}
