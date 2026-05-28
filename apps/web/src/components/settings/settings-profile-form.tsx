'use client';

import Image from 'next/image';
import { Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { updateProfileSettingsAction, uploadAvatarAction } from '@/lib/settings/actions';

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
  const [isUploading, setIsUploading] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [preferredLocale, setPreferredLocale] = useState(user.locale);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    void uploadAvatarAction(formData).then((result) => {
      setIsUploading(false);
      if (result.ok) {
        setAvatarUrl(result.url);
      } else {
        setError(result.error);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

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

  const initial = displayName.charAt(0).toUpperCase() || '?';

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <span className="text-surface text-sm font-medium">{t('profileAvatarLabel')}</span>
        <div className="flex items-center gap-4">
          <span className="border-line/60 relative inline-block h-16 w-16 overflow-hidden rounded-full border">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="bg-accent/15 text-accent flex h-full w-full items-center justify-center text-xl font-semibold">
                {initial}
              </span>
            )}
          </span>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="border-line/80 text-surface hover:bg-surface/[0.04] inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
            >
              <Upload size={14} />
              {isUploading ? t('profileAvatarUploading') : t('profileAvatarUpload')}
            </button>
            <span className="text-muted text-xs">{t('profileAvatarHint')}</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <Input
        label={t('profileDisplayName')}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
      />

      <Input label={t('profileEmail')} value={user.email} disabled />

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
          {error === 'UPLOAD_FAILED'
            ? t('profileAvatarUploadFailed')
            : error === 'TOO_LARGE'
              ? t('profileAvatarTooLarge')
              : error === 'INVALID_TYPE'
                ? t('profileAvatarInvalidType')
                : t('profileError')}
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
