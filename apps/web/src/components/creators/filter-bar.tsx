'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition, type ChangeEvent } from 'react';

import { cn } from '@hikaya/ui';

import type { City, Discipline } from '@/lib/creators/mock-data';

const CITIES: City[] = ['RIYADH', 'JEDDAH', 'DAMMAM', 'KHOBAR', 'MAKKAH', 'MEDINA', 'TABUK', 'ABHA'];

// Subset for the filter chip rail. Full list available via the discipline dropdown.
const FEATURED_DISCIPLINES: Discipline[] = [
  'WEDDING_PHOTOGRAPHY',
  'COMMERCIAL_PHOTOGRAPHY',
  'PRODUCT_PHOTOGRAPHY',
  'FASHION_PHOTOGRAPHY',
  'COMMERCIAL_VIDEO',
  'WEDDING_VIDEO',
  'BRAND_IDENTITY',
];

const DISCIPLINE_KEYS: Record<Discipline, string> = {
  WEDDING_PHOTOGRAPHY: 'weddingPhoto',
  PORTRAIT_PHOTOGRAPHY: 'portraitPhoto',
  COMMERCIAL_PHOTOGRAPHY: 'commercialPhoto',
  PRODUCT_PHOTOGRAPHY: 'productPhoto',
  EVENT_PHOTOGRAPHY: 'eventPhoto',
  FASHION_PHOTOGRAPHY: 'fashionPhoto',
  COMMERCIAL_VIDEO: 'commercialVideo',
  WEDDING_VIDEO: 'weddingVideo',
  EVENT_VIDEO: 'eventVideo',
  DOCUMENTARY: 'documentary',
  GRAPHIC_DESIGN: 'graphicDesign',
  BRAND_IDENTITY: 'brandIdentity',
  MOTION_GRAPHICS: 'motionGraphics',
  VIDEO_EDITING: 'videoEditing',
  COLOR_GRADING: 'colorGrading',
  RETOUCHING: 'retouching',
  DRONE_OPERATION: 'drone',
};

interface Props {
  city: City | null;
  discipline: Discipline | null;
  availableOnly: boolean;
}

/**
 * URL-driven filter bar.
 *
 * The page is a server component that reads searchParams; this client child
 * only mutates the URL. router.replace + scroll:false keeps the experience
 * smooth — the page re-renders on the server with the new params, and the
 * filter bar stays mounted.
 */
export function FilterBar({ city, discipline, availableOnly }: Props) {
  const t = useTranslations('discover.filters');
  const tCity = useTranslations('cities');
  const tDiscipline = useTranslations('disciplines');

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value && value.length > 0) next.set(key, value);
    else next.delete(key);

    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  const hasAny = Boolean(city || discipline || availableOnly);

  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 rounded-xl border border-surface/10 bg-surface/[0.03] p-4 md:p-5',
        isPending && 'opacity-70',
      )}
      aria-busy={isPending || undefined}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Select
          ariaLabel={t('city')}
          value={city ?? ''}
          onChange={(v) => setParam('city', v)}
          placeholder={t('cityPlaceholder')}
          options={CITIES.map((c) => ({ value: c, label: tCity(c as 'RIYADH') }))}
        />

        <Select
          ariaLabel={t('discipline')}
          value={discipline ?? ''}
          onChange={(v) => setParam('discipline', v)}
          placeholder={t('disciplinePlaceholder')}
          options={Object.keys(DISCIPLINE_KEYS).map((d) => ({
            value: d,
            label: tDiscipline(DISCIPLINE_KEYS[d as Discipline] as 'weddingPhoto'),
          }))}
        />

        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-surface/10 bg-surface/5 px-3 py-2 text-sm text-surface/80 transition-colors hover:border-surface/30">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setParam('available', e.target.checked ? '1' : null)
            }
            className="h-4 w-4 cursor-pointer accent-accent"
          />
          {t('availableOnly')}
        </label>

        {hasAny ? (
          <button
            type="button"
            onClick={() => {
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="ms-auto text-2xs text-surface/60 underline decoration-accent-secondary decoration-2 underline-offset-4 transition-colors hover:text-surface"
          >
            {t('clear')}
          </button>
        ) : null}
      </div>

      {/* Quick-pick discipline chips. */}
      <ul className="-mx-1 flex flex-wrap gap-2">
        {FEATURED_DISCIPLINES.map((d) => {
          const active = discipline === d;
          return (
            <li key={d}>
              <button
                type="button"
                onClick={() => setParam('discipline', active ? null : d)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  active
                    ? 'border-accent bg-accent/15 text-accent-secondary'
                    : 'border-surface/10 bg-surface/5 text-surface/70 hover:border-surface/30 hover:text-surface',
                )}
              >
                {tDiscipline(DISCIPLINE_KEYS[d] as 'weddingPhoto')}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

function Select({
  ariaLabel,
  value,
  onChange,
  placeholder,
  options,
}: {
  ariaLabel: string;
  value: string;
  onChange: (v: string | null) => void;
  placeholder: string;
  options: SelectOption[];
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-10 cursor-pointer rounded-md border border-surface/10 bg-surface/5 px-3 pe-8 text-sm text-surface outline-none transition-colors hover:border-surface/30 focus-visible:border-accent"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
