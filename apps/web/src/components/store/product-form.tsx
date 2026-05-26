'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { createProductAction, updateProductAction, type StoreResult } from '@/lib/store/actions';
import type { Product, ProductCategory, ProductStatus } from '@/lib/store/mock-data';
import { PLATFORM_COMMISSION_RATE, commissionFor, creatorTakeFor } from '@/lib/store/mock-data';
import { formatSarFromHalalas } from '@/lib/format';

const CATEGORIES: ProductCategory[] = ['PRESET', 'LUT', 'TEMPLATE', 'OVERLAY', 'GUIDE', 'BUNDLE', 'OTHER'];
const STATUSES: ProductStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];

interface Props {
  locale: Locale;
  /** Existing product when editing; undefined when creating. */
  product?: Product;
  /** Other products by the same creator (for bundle multi-select). */
  otherProducts?: Product[];
}

interface FormShape {
  titleEn: string;
  titleAr?: string;
  descriptionEn: string;
  descriptionAr?: string;
  category: ProductCategory;
  status: ProductStatus;
  priceSar: number;
  fileUrl: string;
  freeSampleUrl?: string;
  previewImagesRaw: string;
  compatibleSoftwareRaw: string;
  bundleItemIdsRaw: string;
}

export function ProductForm({ locale, product, otherProducts = [] }: Props) {
  const t = useTranslations('store.form');
  const tCategory = useTranslations('store.category');
  const tStatus = useTranslations('store.status');

  const isEdit = Boolean(product);
  const action =
    isEdit && product
      ? updateProductAction.bind(null, locale, product.id)
      : createProductAction.bind(null, locale);

  const [serverState, formAction] = useFormState<StoreResult | null, FormData>(action, null);
  const [isPending, startTransition] = useTransition();

  // No zodResolver here: productSchema transforms preview-images and
  // compatibleSoftware from strings to arrays, which RHF can't introspect.
  // The server action re-parses with zod — the canonical check.
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormShape>({
    defaultValues: product
      ? {
          titleEn: product.titleEn,
          titleAr: product.titleAr ?? '',
          descriptionEn: product.descriptionEn,
          descriptionAr: product.descriptionAr ?? '',
          category: product.category,
          status: product.status,
          priceSar: Math.round(product.priceHalalas / 100),
          fileUrl: product.fileUrl,
          freeSampleUrl: product.freeSampleUrl ?? '',
          previewImagesRaw: product.previewImageUrls.join('\n'),
          compatibleSoftwareRaw: product.compatibleSoftware.join(', '),
          bundleItemIdsRaw: (product.bundleItems ?? []).join(', '),
        }
      : {
          titleEn: '',
          titleAr: '',
          descriptionEn: '',
          descriptionAr: '',
          category: 'PRESET',
          status: 'DRAFT',
          priceSar: 0,
          fileUrl: '',
          freeSampleUrl: '',
          previewImagesRaw: '',
          compatibleSoftwareRaw: '',
          bundleItemIdsRaw: '',
        },
  });

  const watchedPrice = watch('priceSar');
  const watchedCategory = watch('category');
  const halalas = Math.max(0, Number(watchedPrice ?? 0)) * 100;

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('titleEn', values.titleEn);
        if (values.titleAr) fd.set('titleAr', values.titleAr);
        fd.set('descriptionEn', values.descriptionEn);
        if (values.descriptionAr) fd.set('descriptionAr', values.descriptionAr);
        fd.set('category', values.category);
        fd.set('status', values.status);
        fd.set('priceSar', String(values.priceSar));
        fd.set('fileUrl', values.fileUrl);
        if (values.freeSampleUrl) fd.set('freeSampleUrl', values.freeSampleUrl);
        fd.set('previewImagesRaw', values.previewImagesRaw);
        fd.set('compatibleSoftwareRaw', values.compatibleSoftwareRaw);
        fd.set('bundleItemIdsRaw', values.bundleItemIdsRaw);
        startTransition(() => formAction(fd));
      })}
      className="flex flex-col gap-6"
      noValidate
    >
      {/* Identity */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label={t('titleEn')}
          {...register('titleEn')}
          error={errors.titleEn?.message ?? serverState?.fieldErrors?.titleEn}
          required
        />
        <Input label={t('titleAr')} {...register('titleAr')} error={errors.titleAr?.message} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label={t('descriptionEn')}
          hint={t('descriptionHint')}
          error={errors.descriptionEn?.message ?? serverState?.fieldErrors?.descriptionEn}
        >
          <textarea
            rows={5}
            {...register('descriptionEn')}
            className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-base outline-none"
          />
        </Field>
        <Field label={t('descriptionAr')} error={errors.descriptionAr?.message}>
          <textarea
            rows={5}
            dir="rtl"
            {...register('descriptionAr')}
            className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-base outline-none"
          />
        </Field>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label={t('category')} error={errors.category?.message}>
          <select
            {...register('category')}
            className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-11 rounded-md border px-3 text-base outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {tCategory(c as 'PRESET')}
              </option>
            ))}
          </select>
        </Field>
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
        <Input
          type="number"
          inputMode="numeric"
          label={t('price')}
          hint={t('priceHint')}
          {...register('priceSar')}
          error={errors.priceSar?.message}
        />
      </section>

      {/* Live take-home for the creator */}
      <aside className="border-accent/30 bg-accent/5 rounded-md border p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <span className="text-2xs text-accent-secondary">{t('takeHome.label')}</span>
            <p className="text-surface/70 text-sm">
              {t('takeHome.hint', { rate: `${Math.round(PLATFORM_COMMISSION_RATE * 100)}%` })}
            </p>
          </div>
          <div className="text-end">
            <p className="text-accent-secondary text-3xl font-bold tabular-nums tracking-tight">
              {formatSarFromHalalas(creatorTakeFor(halalas), locale)}
            </p>
            <p className="text-2xs text-surface/40 font-mono">
              {t('takeHome.commission', {
                amount: formatSarFromHalalas(commissionFor(halalas), locale),
              })}
            </p>
          </div>
        </div>
      </aside>

      {/* Bundle items (only shown when category is BUNDLE) */}
      {watchedCategory === 'BUNDLE' && otherProducts.length > 0 ? (
        <section className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
          <Field
            label={t('bundleItems')}
            hint={t('bundleItemsHint')}
          >
            <select
              multiple
              size={Math.min(6, otherProducts.length)}
              {...register('bundleItemIdsRaw')}
              className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 text-sm outline-none"
            >
              {otherProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titleEn} ({tCategory(p.category as 'PRESET')})
                </option>
              ))}
            </select>
          </Field>
        </section>
      ) : null}

      {/* Files & previews */}
      <section className="flex flex-col gap-4">
        <Input
          label={t('fileUrl')}
          hint={t('fileUrlHint')}
          placeholder="https://files.example.com/your-product.zip"
          {...register('fileUrl')}
          error={errors.fileUrl?.message ?? serverState?.fieldErrors?.fileUrl}
          required
        />
        <Input
          label={t('freeSampleUrl')}
          hint={t('freeSampleUrlHint')}
          placeholder="https://files.example.com/sample.xmp"
          {...register('freeSampleUrl')}
          error={errors.freeSampleUrl?.message}
        />

        <Field
          label={t('previewImages')}
          hint={t('previewImagesHint')}
          error={errors.previewImagesRaw?.message ?? serverState?.fieldErrors?.previewImagesRaw}
        >
          <textarea
            rows={4}
            {...register('previewImagesRaw')}
            placeholder={'https://images.example.com/01.jpg\nhttps://images.example.com/02.jpg'}
            className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent rounded-md border px-3 py-2 font-mono text-sm outline-none"
          />
        </Field>

        <Input
          label={t('compatibleSoftware')}
          hint={t('compatibleSoftwareHint')}
          placeholder="Lightroom Classic, Lightroom Mobile"
          {...register('compatibleSoftwareRaw')}
          error={errors.compatibleSoftwareRaw?.message}
        />
      </section>

      {serverState?.error && serverState.error !== 'INVALID_INPUT' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {t('errorGeneric')}
        </p>
      ) : null}

      <div className={cn('flex items-center gap-3')}>
        <Button type="submit" size="lg" isLoading={isPending}>
          {isEdit ? t('save') : t('create')}
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
