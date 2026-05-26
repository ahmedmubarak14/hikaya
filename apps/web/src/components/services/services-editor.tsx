'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { saveServicesAction } from '@/lib/services/actions';
import type { CreatorService } from '@/lib/services/types';

interface Props {
  locale: Locale;
  initialServices: CreatorService[];
}

function generateId() {
  return `svc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ServicesEditor({ locale, initialServices }: Props) {
  const t = useTranslations('services');
  const [isPending, startTransition] = useTransition();
  const [services, setServices] = useState<CreatorService[]>(initialServices);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addService = () => {
    setServices((prev) => [
      ...prev,
      { id: generateId(), nameEn: '', priceHalalas: 0 },
    ]);
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const updateService = (id: string, field: keyof CreatorService, value: string | number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const handleSave = () => {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await saveServicesAction(locale, services);
      if (result.ok) {
        setSaved(true);
      } else {
        setError(result.error ?? 'UNKNOWN');
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {services.length === 0 ? (
        <div className="border-surface/10 bg-surface/[0.03] rounded-lg border p-6 text-center">
          <p className="text-surface/60 text-sm">{t('editorEmpty')}</p>
          <p className="text-surface/40 mt-1 text-xs">{t('editorEmptyHint')}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {services.map((service, idx) => (
            <li
              key={service.id}
              className="border-surface/10 bg-surface/[0.02] rounded-lg border p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-surface/40 text-xs font-medium">
                  {t('serviceNumber', { n: idx + 1 })}
                </span>
                <button
                  type="button"
                  onClick={() => removeService(service.id)}
                  className="text-accent-secondary hover:text-accent-secondary/80 text-xs"
                >
                  {t('removeService')}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label={t('serviceNameEn')}
                  value={service.nameEn}
                  onChange={(e) => updateService(service.id, 'nameEn', e.target.value)}
                  required
                />
                <Input
                  label={t('serviceNameAr')}
                  value={service.nameAr ?? ''}
                  onChange={(e) => updateService(service.id, 'nameAr', e.target.value)}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label={t('servicePriceSar')}
                  type="number"
                  inputMode="numeric"
                  value={String(Math.round(service.priceHalalas / 100) || '')}
                  onChange={(e) =>
                    updateService(
                      service.id,
                      'priceHalalas',
                      Math.round(Number(e.target.value) * 100),
                    )
                  }
                  hint={t('servicePriceHint')}
                  required
                />
                <Input
                  label={t('serviceDescription')}
                  value={service.description ?? ''}
                  onChange={(e) => updateService(service.id, 'description', e.target.value)}
                  hint={t('serviceDescriptionHint')}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="md" variant="outline" onClick={addService}>
          {t('addService')}
        </Button>
        <Button type="button" size="md" onClick={handleSave} isLoading={isPending}>
          {t('saveServices')}
        </Button>
        {saved ? (
          <span className="text-2xs text-accent-secondary">{t('servicesSaved')}</span>
        ) : null}
        {error ? (
          <span className="text-accent-secondary text-xs">{t('servicesError')}</span>
        ) : null}
      </div>
    </div>
  );
}
