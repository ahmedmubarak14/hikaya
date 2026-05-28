'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { updateProfileAction, type EditorResult } from '@/lib/creators/actions';
import type {
  Availability,
  City,
  CreatorProfile,
  Discipline,
  PortfolioLayout,
} from '@/lib/creators/mock-data';
import { profileEditSchema, type ProfileEditValues } from '@/lib/creators/schemas';

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

const AVAILABILITIES: Availability[] = ['AVAILABLE', 'BUSY', 'ON_VACATION'];
const LAYOUTS: PortfolioLayout[] = ['MASONRY', 'EDITORIAL', 'REEL'];

interface Props {
  locale: Locale;
  creator: CreatorProfile;
}

export function ProfileEditForm({ locale, creator }: Props) {
  const t = useTranslations('portfolioEditor.profile');
  const tDiscipline = useTranslations('disciplines');
  const tCity = useTranslations('cities');

  const [serverState, formAction] = useFormState<EditorResult | null, FormData>(
    updateProfileAction.bind(null, locale),
    null,
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      displayNameEn: creator.displayNameEn ?? '',
      displayNameAr: creator.displayNameAr ?? '',
      bioEn: creator.bioEn ?? '',
      bioAr: creator.bioAr ?? '',
      city: creator.city,
      disciplines: creator.disciplines ?? [],
      startingPriceSar: creator.startingPriceSar ?? undefined,
      availability: creator.availability,
      preferredLayout: creator.preferredLayout,
    },
  });

  const selectedDisciplines = watch('disciplines') ?? [];

  const toggleDiscipline = (d: Discipline) => {
    const set = new Set(selectedDisciplines);
    if (set.has(d)) set.delete(d);
    else if (set.size < 5) set.add(d);
    setValue('disciplines', Array.from(set), { shouldValidate: true, shouldDirty: true });
  };

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('displayNameEn', values.displayNameEn);
        fd.set('displayNameAr', values.displayNameAr);
        if (values.bioEn) fd.set('bioEn', values.bioEn);
        if (values.bioAr) fd.set('bioAr', values.bioAr);
        fd.set('city', values.city);
        for (const d of values.disciplines) fd.append('disciplines', d);
        if (values.startingPriceSar) fd.set('startingPriceSar', String(values.startingPriceSar));
        fd.set('availability', values.availability);
        fd.set('preferredLayout', values.preferredLayout);
        startTransition(() => formAction(fd));
      })}
      className="flex w-full flex-col gap-6"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label={t('displayNameEn')}
          {...register('displayNameEn')}
          error={errors.displayNameEn?.message}
          required
        />
        <Input
          label={t('displayNameAr')}
          {...register('displayNameAr')}
          error={errors.displayNameAr?.message}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={t('bioEn')} hint={t('bioHint')} error={errors.bioEn?.message}>
          <textarea
            rows={4}
            {...register('bioEn')}
            className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-base outline-none"
          />
        </Field>
        <Field label={t('bioAr')} hint={t('bioHint')} error={errors.bioAr?.message}>
          <textarea
            rows={4}
            dir="rtl"
            {...register('bioAr')}
            className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-base outline-none"
          />
        </Field>
      </div>

      <Field
        label={t('disciplines')}
        hint={t('disciplinesHint', { remaining: 5 - selectedDisciplines.length })}
        error={errors.disciplines?.message}
      >
        <div className="-mx-1 flex flex-wrap gap-2">
          {(Object.keys(DISCIPLINE_KEYS) as Discipline[]).map((d) => {
            const active = selectedDisciplines.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDiscipline(d)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  active
                    ? 'border-accent bg-accent/15 text-accent-secondary'
                    : 'border-surface/10 bg-surface/5 text-surface/70 hover:border-surface/30 hover:text-surface',
                )}
              >
                {tDiscipline(DISCIPLINE_KEYS[d] as 'weddingPhoto')}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label={t('city')} error={errors.city?.message}>
          <select
            {...register('city')}
            className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-11 rounded-md border px-3 text-base outline-none"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {tCity(c as 'RIYADH')}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('availability')} error={errors.availability?.message}>
          <select
            {...register('availability')}
            className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-11 rounded-md border px-3 text-base outline-none"
          >
            {AVAILABILITIES.map((a) => (
              <option key={a} value={a}>
                {t(`avail.${a}` as 'avail.AVAILABLE')}
              </option>
            ))}
          </select>
        </Field>

        <Input
          type="number"
          inputMode="numeric"
          label={t('startingPrice')}
          hint={t('startingPriceHint')}
          {...register('startingPriceSar')}
          error={errors.startingPriceSar?.message}
        />
      </div>

      <Field label={t('layout')} hint={t('layoutHint')} error={errors.preferredLayout?.message}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {LAYOUTS.map((layout) => {
            const active = watch('preferredLayout') === layout;
            return (
              <label
                key={layout}
                className={cn(
                  'cursor-pointer rounded-md border px-4 py-3 text-sm transition-colors',
                  active
                    ? 'border-accent bg-accent/10 text-surface'
                    : 'border-surface/15 bg-surface/[0.03] text-surface/70 hover:border-surface/30',
                )}
              >
                <input
                  type="radio"
                  value={layout}
                  {...register('preferredLayout')}
                  className="sr-only"
                />
                <span className="block font-medium">
                  {t(`layouts.${layout}` as 'layouts.MASONRY')}
                </span>
                <span className="text-surface/50 block text-xs">
                  {t(`layouts.${layout}Hint` as 'layouts.MASONRYHint')}
                </span>
              </label>
            );
          })}
        </div>
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" size="md" isLoading={isPending}>
          {t('save')}
        </Button>
        {serverState?.ok ? (
          <span className="text-2xs text-accent-secondary">{t('saved')}</span>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-surface/80 [lang=ar]:font-sansAr text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span className="text-accent-secondary text-xs">{error}</span>
      ) : hint ? (
        <span className="text-surface/50 text-xs">{hint}</span>
      ) : null}
    </label>
  );
}
