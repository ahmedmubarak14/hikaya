'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { bookSpaceAction, type SpacesResult } from '@/lib/spaces/actions';
import { formatSarFromHalalas } from '@/lib/format';
import type { SpaceAddOn } from '@/lib/spaces/mock-data';

interface Props {
  locale: Locale;
  spaceId: string;
  hourlyHalalas: number;
  dailyHalalas: number;
  halfDayHalalas?: number;
  /**
   * Disable for the owner's own space (CTA renders disabled instead of
   * firing). `unauthenticated` falls through to the action, which redirects.
   */
  disabledReason?: 'OWN' | null;
  /** House rules that must be agreed to before booking. */
  houseRules?: string;
  /** Cancellation policy shown above the submit button. */
  cancellationPolicy?: string;
  /** Optional add-ons for the space. */
  addOns?: SpaceAddOn[];
}

/**
 * Inline booking form that lives on the public space detail page. Uses
 * native date inputs + radio for duration kind — the spec calls for "no
 * fancy calendar widget", which matches the rest of the platform's
 * intentionally lightweight form vocabulary.
 */
export function BookForm({ locale, spaceId, hourlyHalalas, dailyHalalas, halfDayHalalas = 0, disabledReason, houseRules, cancellationPolicy, addOns = [] }: Props) {
  const t = useTranslations('spaces.book');
  const action = bookSpaceAction.bind(null, locale, spaceId);
  const [serverState, formAction] = useFormState<SpacesResult | null, FormData>(action, null);
  const [isPending, startTransition] = useTransition();

  // Default to today + tomorrow. Computed per render (not memoized) so the
  // min-date constraint stays correct if the form is open across midnight.
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);
  const [kind, setKind] = useState<'HOURLY' | 'HALF_DAY' | 'DAILY'>('DAILY');
  const [agreedToRules, setAgreedToRules] = useState(!houseRules);
  const [selectedAddOnIndexes, setSelectedAddOnIndexes] = useState<Set<number>>(new Set());

  const hasRules = Boolean(houseRules);

  const selectedAddOns = useMemo(
    () => addOns.filter((_, i) => selectedAddOnIndexes.has(i)),
    [addOns, selectedAddOnIndexes],
  );

  const addOnsTotal = useMemo(
    () => selectedAddOns.reduce((sum, a) => sum + a.priceHalalas, 0),
    [selectedAddOns],
  );

  // Mirror the server's `computeTotalHalalas` for an honest live preview.
  const estimateHalalas = useMemo(() => {
    const startMs = Date.parse(`${startDate}T09:00:00.000Z`);
    const endMs = Date.parse(`${endDate}T18:00:00.000Z`);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;
    const ms = endMs - startMs;
    if (kind === 'HOURLY') {
      const hours = Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
      return hours * hourlyHalalas;
    }
    const days = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
    if (kind === 'HALF_DAY') {
      return days * (halfDayHalalas > 0 ? halfDayHalalas : Math.round(dailyHalalas * 0.6));
    }
    return days * dailyHalalas;
  }, [startDate, endDate, kind, hourlyHalalas, dailyHalalas, halfDayHalalas]);

  const totalWithAddOns = estimateHalalas + addOnsTotal;

  if (disabledReason === 'OWN') {
    return (
      <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
        <p className="text-surface/60 text-sm">{t('cannotBookOwn')}</p>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        startTransition(() => formAction(fd));
      }}
      className="border-surface/10 bg-surface/[0.03] flex flex-col gap-4 rounded-xl border p-5"
      noValidate
    >
      <h3 className="text-surface text-base font-semibold">{t('title')}</h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="text-surface/80 flex flex-col gap-1.5 text-sm">
          <span>{t('startDate')}</span>
          <input
            type="date"
            name="startDate"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-11 rounded-md border px-3 text-base outline-none"
            required
          />
        </label>
        <label className="text-surface/80 flex flex-col gap-1.5 text-sm">
          <span>{t('endDate')}</span>
          <input
            type="date"
            name="endDate"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-11 rounded-md border px-3 text-base outline-none"
            required
          />
        </label>
      </div>

      <fieldset className="flex flex-wrap gap-3">
        <label className="border-surface/15 text-surface/80 has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:text-surface inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm">
          <input
            type="radio"
            name="durationKind"
            value="DAILY"
            checked={kind === 'DAILY'}
            onChange={() => setKind('DAILY')}
            className="sr-only"
          />
          {t('kindDaily')}
        </label>
        {halfDayHalalas > 0 ? (
          <label className="border-surface/15 text-surface/80 has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:text-surface inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm">
            <input
              type="radio"
              name="durationKind"
              value="HALF_DAY"
              checked={kind === 'HALF_DAY'}
              onChange={() => setKind('HALF_DAY')}
              className="sr-only"
            />
            {t('kindHalfDay')}
          </label>
        ) : null}
        <label className="border-surface/15 text-surface/80 has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:text-surface inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm">
          <input
            type="radio"
            name="durationKind"
            value="HOURLY"
            checked={kind === 'HOURLY'}
            onChange={() => setKind('HOURLY')}
            className="sr-only"
          />
          {t('kindHourly')}
        </label>
      </fieldset>

      {/* Add-ons selection */}
      {addOns.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-surface/80 mb-1 text-sm font-medium">{t('addOnsLabel')}</legend>
          {addOns.map((addon, idx) => (
            <label
              key={idx}
              className="text-surface/80 flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedAddOnIndexes.has(idx)}
                onChange={(e) => {
                  const next = new Set(selectedAddOnIndexes);
                  if (e.target.checked) next.add(idx);
                  else next.delete(idx);
                  setSelectedAddOnIndexes(next);
                }}
                className="accent-accent h-4 w-4"
              />
              <span>
                {addon.name}
                {addon.priceHalalas > 0
                  ? ` (+${formatSarFromHalalas(addon.priceHalalas, locale)})`
                  : ''}
              </span>
            </label>
          ))}
          {addOnsTotal > 0 ? (
            <p className="text-2xs text-surface/50">
              {t('addOnsTotal', { price: formatSarFromHalalas(addOnsTotal, locale) })}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      {/* Hidden field for selected add-ons */}
      <input
        type="hidden"
        name="selectedAddOns"
        value={JSON.stringify(selectedAddOns)}
      />

      {totalWithAddOns > 0 ? (
        <p className="text-2xs text-surface/50 [lang=ar]:font-sansAr">
          {t('total', { price: formatSarFromHalalas(totalWithAddOns, locale) })}
        </p>
      ) : null}

      {/* House rules checkbox */}
      {hasRules ? (
        <label className="text-surface/80 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreedToRules}
            onChange={(e) => setAgreedToRules(e.target.checked)}
            className="accent-accent h-4 w-4"
          />
          {t('agreeRules')}
        </label>
      ) : null}

      {cancellationPolicy ? (
        <div className="border-surface/10 bg-surface/[0.02] rounded-lg border p-3">
          <p className="text-surface/70 text-2xs font-medium uppercase tracking-wide">
            {t('cancellationPolicyTitle')}
          </p>
          <p className="text-surface/60 mt-1 whitespace-pre-wrap text-xs leading-relaxed">
            {cancellationPolicy}
          </p>
        </div>
      ) : null}

      {serverState && !serverState.ok ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {serverState.error === 'UNAVAILABLE'
            ? t('unavailable')
            : serverState.error === 'NOT_AUTHENTICATED'
              ? t('needsSignIn')
              : serverState.error === 'CANNOT_BOOK_OWN'
                ? t('cannotBookOwn')
                : t('error')}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        isLoading={isPending}
        disabled={hasRules && !agreedToRules}
      >
        {t('submit')}
      </Button>
    </form>
  );
}
