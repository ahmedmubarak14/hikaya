'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';

import { Button, Input, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import type { City, Discipline } from '@/lib/creators/mock-data';
import { createStudioProfileAction, type StudioProfileFailure } from '@/lib/studio/profile-actions';

interface Props {
  locale: Locale;
}

const CITIES: City[] = [
  'RIYADH',
  'JEDDAH',
  'DAMMAM',
  'KHOBAR',
  'MAKKAH',
  'MEDINA',
  'TABUK',
  'ABHA',
];

const DISCIPLINES: Discipline[] = [
  'WEDDING_PHOTOGRAPHY',
  'PORTRAIT_PHOTOGRAPHY',
  'COMMERCIAL_PHOTOGRAPHY',
  'PRODUCT_PHOTOGRAPHY',
  'EVENT_PHOTOGRAPHY',
  'FASHION_PHOTOGRAPHY',
  'COMMERCIAL_VIDEO',
  'WEDDING_VIDEO',
  'EVENT_VIDEO',
  'DOCUMENTARY',
  'GRAPHIC_DESIGN',
  'BRAND_IDENTITY',
  'MOTION_GRAPHICS',
  'VIDEO_EDITING',
  'COLOR_GRADING',
  'RETOUCHING',
  'DRONE_OPERATION',
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

/**
 * Studio profile creation form (Path B onboarding).
 *
 * Mirrors the sign-up form pattern: useFormState wraps the action, the form
 * builds FormData by hand. Specializations are a multi-select chip rail so
 * the action can read getAll('specializations').
 */
export function StudioProfileForm({ locale }: Props) {
  const t = useTranslations('studioSetup');
  const tCity = useTranslations('cities');
  const tDiscipline = useTranslations('disciplines');

  const [serverState, formAction] = useFormState<StudioProfileFailure | null, FormData>(
    createStudioProfileAction.bind(null, locale),
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>([]);

  function toggleDiscipline(d: Discipline) {
    setSelectedDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Replace the discipline checkboxes with the controlled state.
    fd.delete('specializations');
    for (const d of selectedDisciplines) fd.append('specializations', d);
    startTransition(() => formAction(fd));
  }

  const fieldErr = serverState?.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-5" noValidate>
      <Input
        label={t('nameEn')}
        name="nameEn"
        autoComplete="organization"
        error={fieldErr.nameEn}
        required
      />
      <Input label={t('nameAr')} name="nameAr" dir="rtl" error={fieldErr.nameAr} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-surface/80 font-medium">{t('city')}</span>
          <select
            name="city"
            defaultValue="RIYADH"
            className="border-surface/15 bg-bg text-surface rounded-md border px-3 py-2 text-sm"
            required
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {tCity(c as 'RIYADH')}
              </option>
            ))}
          </select>
        </label>

        <Input
          label={t('capacity')}
          name="capacity"
          type="number"
          min={1}
          max={50}
          defaultValue={1}
          hint={t('capacityHint')}
          error={fieldErr.capacity}
          required
        />
      </div>

      <Input
        label={t('address')}
        name="address"
        autoComplete="street-address"
        error={fieldErr.address}
      />

      <Input
        label={t('logoUrl')}
        name="logoUrl"
        type="url"
        placeholder="https://…"
        error={fieldErr.logoUrl}
      />

      <Input
        label={t('coverUrl')}
        name="coverUrl"
        type="url"
        placeholder="https://…"
        error={fieldErr.coverUrl}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-surface/80 text-sm font-medium">{t('specializations')}</legend>
        <p className="text-surface/50 text-xs">{t('specializationsHint')}</p>
        <div className="flex flex-wrap gap-1.5">
          {DISCIPLINES.map((d) => {
            const isActive = selectedDisciplines.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDiscipline(d)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  isActive
                    ? 'border-accent bg-accent text-ink'
                    : 'border-surface/15 bg-surface/[0.03] text-surface/70 hover:border-surface/30',
                )}
                aria-pressed={isActive}
              >
                {tDiscipline(DISCIPLINE_KEYS[d] as 'weddingPhoto')}
              </button>
            );
          })}
        </div>
        {fieldErr.specializations ? (
          <p className="text-accent-secondary text-xs" role="alert">
            {fieldErr.specializations}
          </p>
        ) : null}
      </fieldset>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-surface/80 font-medium">{t('descriptionEn')}</span>
        <textarea
          name="descriptionEn"
          rows={5}
          className="border-surface/15 bg-bg text-surface rounded-md border px-3 py-2 text-sm"
          required
        />
        {fieldErr.descriptionEn ? (
          <span className="text-accent-secondary text-xs" role="alert">
            {fieldErr.descriptionEn}
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-surface/80 font-medium">{t('descriptionAr')}</span>
        <textarea
          name="descriptionAr"
          rows={5}
          dir="rtl"
          className="border-surface/15 bg-bg text-surface rounded-md border px-3 py-2 text-sm"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label={t('contactEmail')}
          name="contactEmail"
          type="email"
          autoComplete="email"
          error={fieldErr.contactEmail}
        />
        <Input
          label={t('contactPhone')}
          name="contactPhone"
          type="tel"
          autoComplete="tel"
          error={fieldErr.contactPhone}
        />
      </div>

      {serverState?.error === 'STUDIO_ALREADY_EXISTS' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('errors.alreadyExists')}
        </p>
      ) : null}
      {serverState?.error === 'WRONG_ROLE' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('errors.wrongRole')}
        </p>
      ) : null}
      {serverState?.error === 'NOT_AUTHENTICATED' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('errors.notAuthenticated')}
        </p>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-3">
        <Link
          href={`/${locale}/me`}
          className="text-surface/60 hover:text-surface text-sm transition-colors"
        >
          ← {t('cancel')}
        </Link>
        <Button type="submit" size="lg" isLoading={isPending}>
          {t('submit')}
        </Button>
      </div>
    </form>
  );
}
