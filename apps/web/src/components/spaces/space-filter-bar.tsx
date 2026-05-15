'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition, type ChangeEvent } from 'react';

import { cn } from '@hikaya/ui';

import type { SpaceCity } from '@/lib/spaces/mock-data';

const CITIES: SpaceCity[] = [
  'RIYADH',
  'JEDDAH',
  'DAMMAM',
  'KHOBAR',
  'MAKKAH',
  'MEDINA',
  'TABUK',
  'ABHA',
];

interface Props {
  city: SpaceCity | null;
  minCapacity: number | null;
}

/**
 * URL-driven filter row for the `/spaces` listing. City dropdown + minimum
 * capacity number input. Mirrors the visual rhythm of `FilterBar` on
 * `/discover` so the surfaces feel like siblings.
 */
export function SpaceFilterBar({ city, minCapacity }: Props) {
  const t = useTranslations('spaces.public');
  const tCity = useTranslations('cities');

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value && value.length > 0) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', isPending && 'opacity-70')}
      aria-busy={isPending || undefined}
    >
      <label className="text-2xs text-surface/50 flex items-center gap-2">
        <span>{t('cityFilter')}</span>
        <select
          value={city ?? ''}
          onChange={(e) => setParam('city', e.target.value || null)}
          className={cn(
            'h-10 cursor-pointer rounded-full border bg-transparent pe-9 ps-4 text-sm outline-none transition-colors',
            city
              ? 'border-surface/40 text-surface'
              : 'border-surface/15 text-surface/70 hover:border-surface/40 hover:text-surface',
          )}
        >
          <option value="">{t('cityAny')}</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {tCity(c as 'RIYADH')}
            </option>
          ))}
        </select>
      </label>

      <label className="text-2xs text-surface/50 flex items-center gap-2">
        <span>{t('capacityFilter')}</span>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          defaultValue={minCapacity ?? ''}
          onBlur={(e: ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value.trim();
            setParam('minCapacity', v.length > 0 && Number(v) > 0 ? v : null);
          }}
          className="border-surface/15 hover:border-surface/40 focus:border-surface/40 h-10 w-20 rounded-full border bg-transparent pe-3 ps-4 text-sm outline-none transition-colors"
        />
      </label>
    </div>
  );
}
