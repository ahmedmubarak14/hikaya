'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@hikaya/ui';

import {
  updateNotificationPreferencesAction,
  type NotificationPreferences,
} from '@/lib/notifications/actions';

interface Props {
  initialPrefs: NotificationPreferences;
}

export function NotificationPreferencesForm({ initialPrefs }: Props) {
  const t = useTranslations('settings.notifications');
  const [isPending, startTransition] = useTransition();
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPrefs);
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(false);
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction(prefs);
      if (result.ok) setSaved(true);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <CheckboxRow
          label={t('remind7Days')}
          hint={t('remind7DaysHint')}
          checked={prefs.remind7Days}
          onChange={() => handleToggle('remind7Days')}
        />
        <CheckboxRow
          label={t('remind24Hours')}
          hint={t('remind24HoursHint')}
          checked={prefs.remind24Hours}
          onChange={() => handleToggle('remind24Hours')}
        />
        <CheckboxRow
          label={t('remindDayOf')}
          hint={t('remindDayOfHint')}
          checked={prefs.remindDayOf}
          onChange={() => handleToggle('remindDayOf')}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} isLoading={isPending}>
          {t('save')}
        </Button>
        {saved && (
          <span className="text-2xs text-accent-secondary">{t('saved')}</span>
        )}
      </div>
    </div>
  );
}

function CheckboxRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3" aria-label={label}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-accent mt-0.5 h-4 w-4 rounded"
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-surface text-sm">{label}</span>
        <span className="text-surface/40 text-xs">{hint}</span>
      </div>
    </label>
  );
}
