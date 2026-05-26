'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { saveServicesAction } from '@/lib/services/actions';
import type { CreatorService, ServiceTier } from '@/lib/services/types';

interface Props {
  locale: Locale;
  initialServices: CreatorService[];
}

function generateId(prefix = 'svc') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

  const updateService = (id: string, field: keyof CreatorService, value: unknown) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const addTier = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== serviceId) return s;
        const tiers = s.tiers ?? [];
        return {
          ...s,
          tiers: [
            ...tiers,
            { id: generateId('tier'), nameEn: '', priceHalalas: 0 },
          ],
        };
      }),
    );
  };

  const removeTier = (serviceId: string, tierId: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== serviceId) return s;
        const tiers = (s.tiers ?? []).filter((t) => t.id !== tierId);
        return { ...s, tiers: tiers.length > 0 ? tiers : undefined };
      }),
    );
  };

  const updateTier = (serviceId: string, tierId: string, field: keyof ServiceTier, value: unknown) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== serviceId) return s;
        const tiers = (s.tiers ?? []).map((t) =>
          t.id === tierId ? { ...t, [field]: value } : t,
        );
        // Sync base priceHalalas to lowest tier price
        const lowestPrice = tiers.reduce(
          (min, t) => (t.priceHalalas > 0 && t.priceHalalas < min ? t.priceHalalas : min),
          Infinity,
        );
        return {
          ...s,
          tiers,
          priceHalalas: lowestPrice === Infinity ? s.priceHalalas : lowestPrice,
        };
      }),
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
                {/* Only show base price if there are no tiers */}
                {!service.tiers || service.tiers.length === 0 ? (
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
                ) : null}
                <Input
                  label={t('serviceDescription')}
                  value={service.description ?? ''}
                  onChange={(e) => updateService(service.id, 'description', e.target.value)}
                  hint={t('serviceDescriptionHint')}
                />
              </div>

              {/* Package tiers */}
              {service.tiers && service.tiers.length > 0 ? (
                <div className="mt-5">
                  <span className="text-surface/50 text-xs font-medium">{t('tiersLabel')}</span>
                  <ul className="mt-2 flex flex-col gap-3">
                    {service.tiers.map((tier) => (
                      <li
                        key={tier.id}
                        className="border-surface/10 bg-surface/[0.03] rounded-lg border p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-surface/40 text-2xs">{tier.nameEn || t('tierUntitled')}</span>
                          <button
                            type="button"
                            onClick={() => removeTier(service.id, tier.id)}
                            className="text-accent-secondary hover:text-accent-secondary/80 text-2xs"
                          >
                            {t('removeTier')}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <Input
                            label={t('tierName')}
                            value={tier.nameEn}
                            onChange={(e) =>
                              updateTier(service.id, tier.id, 'nameEn', e.target.value)
                            }
                            required
                          />
                          <Input
                            label={t('tierPrice')}
                            type="number"
                            inputMode="numeric"
                            value={String(Math.round(tier.priceHalalas / 100) || '')}
                            onChange={(e) =>
                              updateTier(
                                service.id,
                                tier.id,
                                'priceHalalas',
                                Math.round(Number(e.target.value) * 100),
                              )
                            }
                            required
                          />
                          <Input
                            label={t('tierDescription')}
                            value={tier.description ?? ''}
                            onChange={(e) =>
                              updateTier(service.id, tier.id, 'description', e.target.value)
                            }
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => addTier(service.id)}
                  className="text-accent-secondary hover:text-accent-secondary/80 text-xs"
                >
                  {t('addTier')}
                </button>
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
