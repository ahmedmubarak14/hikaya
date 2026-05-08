'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import type { City, Discipline } from '@/lib/creators/mock-data';
import { postJobAction, type JobResult } from '@/lib/jobs/actions';
import { postJobSchema, type PostJobValues } from '@/lib/jobs/schemas';

const CITIES: City[] = ['RIYADH', 'JEDDAH', 'DAMMAM', 'KHOBAR', 'MAKKAH', 'MEDINA', 'TABUK', 'ABHA'];

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
}

export function PostJobForm({ locale }: Props) {
  const t = useTranslations('jobs.post');
  const tDiscipline = useTranslations('disciplines');
  const tCity = useTranslations('cities');

  const [serverState, formAction] = useFormState<JobResult | null, FormData>(
    postJobAction.bind(null, locale),
    null,
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PostJobValues>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      title: '',
      discipline: 'COMMERCIAL_PHOTOGRAPHY',
      city: 'RIYADH',
      description: '',
      budgetIsOpen: false,
      creatorsNeeded: 1,
      deadline: '',
      postedByCompany: '',
    },
  });

  const budgetIsOpen = watch('budgetIsOpen');

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('title', values.title);
        fd.set('discipline', values.discipline);
        fd.set('city', values.city);
        fd.set('description', values.description);
        if (values.budgetIsOpen) fd.set('budgetIsOpen', 'on');
        if (values.budgetSar) fd.set('budgetSar', String(values.budgetSar));
        fd.set('creatorsNeeded', String(values.creatorsNeeded));
        fd.set('deadline', values.deadline);
        if (values.postedByCompany) fd.set('postedByCompany', values.postedByCompany);
        startTransition(() => formAction(fd));
      })}
      className="flex flex-col gap-5"
      noValidate
    >
      <Input label={t('titleField')} {...register('title')} error={errors.title?.message} required />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={t('discipline')} error={errors.discipline?.message}>
          <select
            {...register('discipline')}
            className="h-11 rounded-md border border-surface/15 bg-surface/5 px-3 text-base text-surface outline-none focus-visible:border-accent"
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
            className="h-11 rounded-md border border-surface/15 bg-surface/5 px-3 text-base text-surface outline-none focus-visible:border-accent"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {tCity(c as 'RIYADH')}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t('description')} hint={t('descriptionHint')} error={errors.description?.message}>
        <textarea
          rows={6}
          {...register('description')}
          placeholder={t('descriptionPlaceholder')}
          className="rounded-md border border-surface/15 bg-surface/5 px-3 py-2 text-base text-surface outline-none focus-visible:border-accent"
        />
      </Field>

      <div className="rounded-md border border-surface/10 bg-surface/[0.03] p-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-surface/80">
          <input type="checkbox" {...register('budgetIsOpen')} className="mt-0.5 h-4 w-4 accent-accent" />
          <span>
            <span className="block font-medium text-surface">{t('budgetOpen')}</span>
            <span className="block text-xs text-surface/50">{t('budgetOpenHint')}</span>
          </span>
        </label>

        {!budgetIsOpen ? (
          <div className="mt-4">
            <Input
              type="number"
              inputMode="numeric"
              label={t('budget')}
              hint={t('budgetCurrency')}
              {...register('budgetSar')}
              error={errors.budgetSar?.message}
            />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input
          type="number"
          inputMode="numeric"
          label={t('creatorsNeeded')}
          hint={t('creatorsNeededHint')}
          {...register('creatorsNeeded')}
          error={errors.creatorsNeeded?.message}
        />
        <Input
          type="date"
          label={t('deadline')}
          {...register('deadline')}
          error={errors.deadline?.message}
        />
        <Input
          label={t('company')}
          hint={t('companyHint')}
          {...register('postedByCompany')}
          error={errors.postedByCompany?.message}
        />
      </div>

      {serverState?.error && serverState.error !== 'INVALID_INPUT' ? (
        <p className="text-sm text-accent-secondary" role="alert">
          {t('errorGeneric')}
        </p>
      ) : null}

      <div className={cn('flex items-center gap-3')}>
        <Button type="submit" size="lg" isLoading={isPending}>
          {t('submit')}
        </Button>
        <span className="text-xs text-surface/50">{t('expiryNote')}</span>
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
      <span className="text-sm font-medium text-surface/80 [lang=ar]:font-sansAr">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-accent-secondary">{error}</span>
      ) : hint ? (
        <span className="text-xs text-surface/50">{hint}</span>
      ) : null}
    </label>
  );
}
