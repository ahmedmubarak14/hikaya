'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { createSpaceAction, updateSpaceAction, type SpacesResult } from '@/lib/spaces/actions';
import type { Space, SpaceCity, SpaceStatus } from '@/lib/spaces/mock-data';

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
const STATUSES: SpaceStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED'];

interface Props {
  locale: Locale;
  /** Existing space when editing; undefined when creating. */
  space?: Space;
}

interface FormShape {
  name: string;
  description: string;
  address: string;
  city: SpaceCity;
  capacity: number;
  hourlySar: number;
  dailySar: number;
  halfDaySar: number;
  status: SpaceStatus;
  photosRaw: string;
  equipmentRaw: string;
  houseRules: string;
  cancellationPolicy: string;
  addOnsRaw: string;
}

/**
 * Studio create/edit form. Mirrors `ProductForm` shape:
 *   - RHF for UX feedback, server-side zod is the canonical validator.
 *   - photosRaw and equipmentRaw are textareas that the schema splits.
 *   - No zodResolver — the transforms confuse RHF introspection.
 */
export function SpaceForm({ locale, space }: Props) {
  const t = useTranslations('spaces.form');
  const tCity = useTranslations('cities');
  const tStatus = useTranslations('spaces.owner.status');

  const isEdit = Boolean(space);
  const action =
    isEdit && space
      ? updateSpaceAction.bind(null, locale, space.id)
      : createSpaceAction.bind(null, locale);

  const [serverState, formAction] = useFormState<SpacesResult | null, FormData>(action, null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormShape>({
    defaultValues: space
      ? {
          name: space.name,
          description: space.description,
          address: space.address,
          city: space.city,
          capacity: space.capacity,
          hourlySar: Math.round(space.hourlyHalalas / 100),
          dailySar: Math.round(space.dailyHalalas / 100),
          halfDaySar: Math.round((space.halfDayHalalas ?? 0) / 100),
          status: space.status,
          photosRaw: space.photos.join('\n'),
          equipmentRaw: space.equipmentIncluded.join(', '),
          houseRules: space.houseRules ?? '',
          cancellationPolicy: space.cancellationPolicy ?? '',
          addOnsRaw: space.addOns
            .map((a) => `${a.name}, ${Math.round(a.priceHalalas / 100)}`)
            .join('\n'),
        }
      : {
          name: '',
          description: '',
          address: '',
          city: 'RIYADH',
          capacity: 4,
          hourlySar: 0,
          dailySar: 0,
          halfDaySar: 0,
          status: 'DRAFT',
          photosRaw: '',
          equipmentRaw: '',
          houseRules: '',
          cancellationPolicy: '',
          addOnsRaw: '',
        },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('name', values.name);
        fd.set('description', values.description);
        fd.set('address', values.address);
        fd.set('city', values.city);
        fd.set('capacity', String(values.capacity));
        fd.set('hourlySar', String(values.hourlySar));
        fd.set('dailySar', String(values.dailySar));
        fd.set('halfDaySar', String(values.halfDaySar));
        fd.set('status', values.status);
        fd.set('photosRaw', values.photosRaw);
        fd.set('equipmentRaw', values.equipmentRaw);
        fd.set('houseRules', values.houseRules);
        fd.set('cancellationPolicy', values.cancellationPolicy);
        fd.set('addOnsRaw', values.addOnsRaw);
        startTransition(() => formAction(fd));
      })}
      className="flex flex-col gap-6"
      noValidate
    >
      <Input
        label={t('name')}
        {...register('name')}
        error={errors.name?.message ?? serverState?.fieldErrors?.name}
        required
      />

      <Field
        label={t('description')}
        hint={t('descriptionHint')}
        error={errors.description?.message ?? serverState?.fieldErrors?.description}
      >
        <textarea
          rows={5}
          {...register('description')}
          className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-base outline-none"
        />
      </Field>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label={t('address')}
          {...register('address')}
          error={errors.address?.message ?? serverState?.fieldErrors?.address}
          required
        />
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
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input
          type="number"
          inputMode="numeric"
          label={t('capacity')}
          {...register('capacity')}
          error={errors.capacity?.message ?? serverState?.fieldErrors?.capacity}
          required
        />
        <Input
          type="number"
          inputMode="numeric"
          label={t('hourly')}
          hint={t('rateHint')}
          {...register('hourlySar')}
          error={errors.hourlySar?.message ?? serverState?.fieldErrors?.hourlySar}
        />
        <Input
          type="number"
          inputMode="numeric"
          label={t('daily')}
          {...register('dailySar')}
          error={errors.dailySar?.message ?? serverState?.fieldErrors?.dailySar}
        />
        <Input
          type="number"
          inputMode="numeric"
          label={t('halfDay')}
          hint={t('halfDayHint')}
          {...register('halfDaySar')}
          error={errors.halfDaySar?.message ?? serverState?.fieldErrors?.halfDaySar}
        />
      </section>

      <Field label={t('status')} hint={t('statusHint')} error={errors.status?.message}>
        <select
          {...register('status')}
          className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-11 rounded-md border px-3 text-base outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {tStatus(s as 'DRAFT')}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={t('photos')}
        hint={t('photosHint')}
        error={errors.photosRaw?.message ?? serverState?.fieldErrors?.photosRaw}
      >
        <textarea
          rows={4}
          {...register('photosRaw')}
          placeholder={'https://images.example.com/01.jpg\nhttps://images.example.com/02.jpg'}
          className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 font-mono text-sm outline-none"
        />
      </Field>

      <Input
        label={t('equipment')}
        hint={t('equipmentHint')}
        placeholder="Cyclorama, Strobes, Backdrops"
        {...register('equipmentRaw')}
        error={errors.equipmentRaw?.message}
      />

      <Field
        label={t('houseRules')}
        hint={t('houseRulesHint')}
      >
        <textarea
          rows={3}
          {...register('houseRules')}
          className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-base outline-none"
          placeholder="No food or drinks in the studio. Shoes off on the cyclorama."
        />
      </Field>

      <Field label={t('cancellationPolicy')} hint={t('cancellationPolicyHint')}>
        <textarea
          rows={3}
          {...register('cancellationPolicy')}
          className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-base outline-none"
          placeholder="Free cancellation up to 48 hours before the booking. 50% charge within 48 hours."
        />
      </Field>

      <Field
        label={t('addOnsLabel')}
        hint={t('addOnsHint')}
      >
        <textarea
          rows={3}
          {...register('addOnsRaw')}
          className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 font-mono text-sm outline-none"
          placeholder={'Fog machine, 30\nOn-set assistant (4h), 200'}
        />
      </Field>

      {serverState?.error && serverState.error !== 'INVALID_INPUT' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('errorGeneric')}
        </p>
      ) : null}

      <div className={cn('flex items-center gap-3')}>
        <Button type="submit" size="lg" isLoading={isPending}>
          {isEdit ? t('save') : t('submit')}
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
