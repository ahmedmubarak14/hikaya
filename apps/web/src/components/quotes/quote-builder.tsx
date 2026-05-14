'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button, Input, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { formatSarFromHalalas } from '@/lib/format';
import { createQuoteAction, type QuoteResult } from '@/lib/quotes/actions';
import { VAT_RATE } from '@/lib/quotes/mock-data';
import { createQuoteSchema, type CreateQuoteValues } from '@/lib/quotes/schemas';

interface Props {
  locale: Locale;
}

const DEFAULT_VALUES: CreateQuoteValues = {
  clientName: '',
  clientEmail: '',
  notes: '',
  expiresInDays: 7,
  discountSar: undefined,
  lineItems: [{ descriptionEn: '', descriptionAr: '', quantity: 1, unitSar: 0 }],
};

export function QuoteBuilder({ locale }: Props) {
  const t = useTranslations('quotes.builder');
  const [serverState, formAction] = useFormState<QuoteResult | null, FormData>(
    createQuoteAction.bind(null, locale),
    null,
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateQuoteValues>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  const watchedLineItems = watch('lineItems');
  const watchedDiscount = watch('discountSar');

  const totals = useMemo(() => {
    const subtotalSar = (watchedLineItems ?? []).reduce(
      (sum, li) => sum + Math.max(0, Number(li?.quantity ?? 0) * Number(li?.unitSar ?? 0)),
      0,
    );
    const discountSar = Math.max(0, Number(watchedDiscount ?? 0) || 0);
    const afterDiscount = Math.max(0, subtotalSar - discountSar);
    const vatSar = Math.round(afterDiscount * VAT_RATE);
    return {
      subtotal: subtotalSar * 100,
      discount: discountSar * 100,
      vat: vatSar * 100,
      total: (afterDiscount + vatSar) * 100,
    };
  }, [watchedLineItems, watchedDiscount]);

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('clientName', values.clientName);
        if (values.clientEmail) fd.set('clientEmail', values.clientEmail);
        if (values.notes) fd.set('notes', values.notes);
        if (values.expiresInDays) fd.set('expiresInDays', String(values.expiresInDays));
        if (values.discountSar) fd.set('discountSar', String(values.discountSar));
        values.lineItems.forEach((li, idx) => {
          fd.set(`lineItems.${idx}.descriptionEn`, li.descriptionEn);
          if (li.descriptionAr) fd.set(`lineItems.${idx}.descriptionAr`, li.descriptionAr);
          fd.set(`lineItems.${idx}.quantity`, String(li.quantity));
          fd.set(`lineItems.${idx}.unitSar`, String(li.unitSar));
        });
        startTransition(() => formAction(fd));
      })}
      className="flex flex-col gap-8"
      noValidate
    >
      {/* Client */}
      <section className="flex flex-col gap-4 rounded-xl border border-surface/10 bg-surface/[0.03] p-5">
        <h2 className="text-xl text-surface">{t('client.title')}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label={t('client.name')} {...register('clientName')} error={errors.clientName?.message} required />
          <Input
            type="email"
            label={t('client.email')}
            hint={t('client.emailHint')}
            {...register('clientEmail')}
            error={errors.clientEmail?.message}
          />
        </div>
      </section>

      {/* Line items */}
      <section className="flex flex-col gap-4">
        <header className="flex items-baseline justify-between">
          <h2 className="text-xl text-surface">{t('items.title')}</h2>
          <span className="text-2xs text-surface/40">
            {t('items.maxHint')}
          </span>
        </header>

        <ul className="flex flex-col gap-3">
          {fields.map((field, idx) => (
            <li key={field.id} className="rounded-md border border-surface/10 bg-surface/[0.03] p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_120px_140px_auto]">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Input
                    label={idx === 0 ? t('items.descriptionEn') : undefined}
                    placeholder={t('items.descriptionEnPlaceholder')}
                    {...register(`lineItems.${idx}.descriptionEn`)}
                    error={errors.lineItems?.[idx]?.descriptionEn?.message}
                  />
                  <Input
                    label={idx === 0 ? t('items.descriptionAr') : undefined}
                    placeholder={t('items.descriptionArPlaceholder')}
                    {...register(`lineItems.${idx}.descriptionAr`)}
                    error={errors.lineItems?.[idx]?.descriptionAr?.message}
                  />
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  label={idx === 0 ? t('items.quantity') : undefined}
                  {...register(`lineItems.${idx}.quantity`)}
                  error={errors.lineItems?.[idx]?.quantity?.message}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  label={idx === 0 ? t('items.unit') : undefined}
                  hint={idx === 0 ? t('items.currency') : undefined}
                  {...register(`lineItems.${idx}.unitSar`)}
                  error={errors.lineItems?.[idx]?.unitSar?.message}
                />
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(idx)}
                  disabled={fields.length === 1}
                  className={cn(
                    'self-end rounded-full px-3 py-2 text-2xs transition-colors',
                    fields.length === 1
                      ? 'cursor-not-allowed text-surface/20'
                      : 'text-accent-secondary hover:bg-accent-secondary/10',
                  )}
                >
                  {t('items.remove')}
                </button>
              </div>
            </li>
          ))}
        </ul>

        {errors.lineItems?.message ? (
          <p className="text-xs text-accent-secondary">{errors.lineItems.message}</p>
        ) : null}

        <button
          type="button"
          onClick={() => append({ descriptionEn: '', descriptionAr: '', quantity: 1, unitSar: 0 })}
          disabled={fields.length >= 20}
          className={cn(
            'self-start rounded-full border border-surface/15 px-4 py-2 text-sm transition-colors',
            fields.length >= 20
              ? 'cursor-not-allowed text-surface/30'
              : 'text-surface/80 hover:border-surface/40 hover:text-surface',
          )}
        >
          + {t('items.addRow')}
        </button>
      </section>

      {/* Notes + extras + totals */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-surface/80 [lang=ar]:font-sansAr">
              {t('notes')}
            </span>
            <textarea
              rows={4}
              {...register('notes')}
              placeholder={t('notesPlaceholder')}
              className="rounded-md border border-surface/15 bg-surface/5 px-3 py-2 text-base text-surface outline-none focus-visible:border-accent"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              inputMode="numeric"
              label={t('expiresInDays')}
              hint={t('expiresInDaysHint')}
              {...register('expiresInDays')}
              error={errors.expiresInDays?.message}
            />
            <Input
              type="number"
              inputMode="numeric"
              label={t('discount')}
              hint={t('discountHint')}
              {...register('discountSar')}
              error={errors.discountSar?.message}
            />
          </div>
        </div>

        <aside className="flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent/5 p-5">
          <span className="text-2xs text-accent-secondary">
            {t('totals.live')}
          </span>
          <Row label={t('totals.subtotal')} value={formatSarFromHalalas(totals.subtotal, locale)} />
          {totals.discount > 0 ? (
            <Row label={t('totals.discount')} value={`- ${formatSarFromHalalas(totals.discount, locale)}`} />
          ) : null}
          <Row label={t('totals.vat')} value={formatSarFromHalalas(totals.vat, locale)} />
          <hr className="my-1 border-accent/30" />
          <Row label={t('totals.grand')} value={formatSarFromHalalas(totals.total, locale)} accent />
        </aside>
      </section>

      {serverState?.error && serverState.error !== 'INVALID_INPUT' ? (
        <p className="text-sm text-accent-secondary" role="alert">
          {t('errorGeneric')}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" isLoading={isPending}>
          {t('submit')}
        </Button>
        <span className="text-xs text-surface/50">{t('submitHint')}</span>
      </div>
    </form>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span
        className={
          accent
            ? 'text-base font-medium text-surface'
            : 'text-2xs text-surface/60'
        }
      >
        {label}
      </span>
      <span className={accent ? 'text-3xl font-bold tabular-nums tracking-tight text-accent-secondary' : 'text-sm tabular-nums text-surface'}>
        {value}
      </span>
    </div>
  );
}
