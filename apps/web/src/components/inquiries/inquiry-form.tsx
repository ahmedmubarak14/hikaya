'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import type { City, Discipline } from '@/lib/creators/mock-data';
import { submitInquiryAction, type SubmitInquiryFailure } from '@/lib/inquiries/actions';
import { inquiryFormSchema, type InquiryFormValues } from '@/lib/inquiries/schemas';

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

interface Props {
  locale: Locale;
  username: string;
  defaultDiscipline: Discipline;
  defaultCity: City;
}

export function InquiryForm({ locale, username, defaultDiscipline, defaultCity }: Props) {
  const t = useTranslations('inquiry.form');
  const tDiscipline = useTranslations('disciplines');
  const tCity = useTranslations('cities');

  const [serverState, formAction] = useFormState<SubmitInquiryFailure | null, FormData>(
    submitInquiryAction.bind(null, locale, username),
    null,
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      discipline: defaultDiscipline,
      sessionDate: '',
      city: defaultCity,
      locationDetail: '',
      description: '',
      budgetMinSar: undefined,
      budgetMaxSar: undefined,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('discipline', values.discipline);
        fd.set('sessionDate', values.sessionDate);
        fd.set('city', values.city);
        if (values.locationDetail) fd.set('locationDetail', values.locationDetail);
        fd.set('description', values.description);
        if (values.budgetMinSar) fd.set('budgetMinSar', String(values.budgetMinSar));
        if (values.budgetMaxSar) fd.set('budgetMaxSar', String(values.budgetMaxSar));
        startTransition(() => formAction(fd));
      })}
      className="flex w-full flex-col gap-5"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('discipline')} error={errors.discipline?.message}>
          <select
            {...register('discipline')}
            className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-11 rounded-md border px-3 text-base outline-none"
          >
            {(Object.keys(DISCIPLINE_KEYS) as Discipline[]).map((d) => (
              <option key={d} value={d}>
                {tDiscipline(DISCIPLINE_KEYS[d] as 'weddingPhoto')}
              </option>
            ))}
          </select>
        </Field>

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
      </div>

      <Input
        type="date"
        label={t('sessionDate')}
        {...register('sessionDate')}
        error={errors.sessionDate?.message}
        required
      />

      <Input
        label={t('locationDetail')}
        hint={t('locationDetailHint')}
        {...register('locationDetail')}
        error={errors.locationDetail?.message}
      />

      <Field
        label={t('description')}
        error={errors.description?.message}
        hint={t('descriptionHint')}
      >
        <textarea
          rows={5}
          {...register('description')}
          className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-base outline-none"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="number"
          inputMode="numeric"
          label={t('budgetMin')}
          hint={t('budgetCurrency')}
          {...register('budgetMinSar')}
          error={errors.budgetMinSar?.message}
        />
        <Input
          type="number"
          inputMode="numeric"
          label={t('budgetMax')}
          hint={t('budgetCurrency')}
          {...register('budgetMaxSar')}
          error={errors.budgetMaxSar?.message}
        />
      </div>

      {serverState?.error === 'CREATOR_NOT_FOUND' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('errorCreatorNotFound')}
        </p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isPending} className="mt-2 self-start">
        {t('submit')}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
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
