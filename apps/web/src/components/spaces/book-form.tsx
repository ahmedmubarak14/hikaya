'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { bookSpaceAction, type SpacesResult } from '@/lib/spaces/actions';
import { formatSarFromHalalas } from '@/lib/format';

interface Props {
  locale: Locale;
  spaceId: string;
  hourlyHalalas: number;
  dailyHalalas: number;
  /**
   * Disable for the owner's own space (CTA renders disabled instead of
   * firing). `unauthenticated` falls through to the action, which redirects.
   */
  disabledReason?: 'OWN' | null;
}

/**
 * Inline booking form that lives on the public space detail page. Uses
 * native date inputs + radio for duration kind — the spec calls for "no
 * fancy calendar widget", which matches the rest of the platform's
 * intentionally lightweight form vocabulary.
 */
export function BookForm({ locale, spaceId, hourlyHalalas, dailyHalalas, disabledReason }: Props) {
  const t = useTranslations('spaces.book');
  const action = bookSpaceAction.bind(null, locale, spaceId);
  const [serverState, formAction] = useFormState<SpacesResult | null, FormData>(action, null);
  const [isPending, startTransition] = useTransition();

  // Default to today + tomorrow so the estimated-total preview has values.
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);
  const [kind, setKind] = useState<'HOURLY' | 'DAILY'>('DAILY');

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
    return days * dailyHalalas;
  }, [startDate, endDate, kind, hourlyHalalas, dailyHalalas]);

  if (disabledReason === 'OWN') {
    return (
      <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-5">
        <p className="text-sm text-surface/60">{t('cannotBookOwn')}</p>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        startTransition(() => formAction(fd));
      }}
      className="flex flex-col gap-4 rounded-xl border border-surface/10 bg-surface/[0.03] p-5"
      noValidate
    >
      <h3 className="text-base font-semibold text-surface">{t('title')}</h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm text-surface/80">
          <span>{t('startDate')}</span>
          <input
            type="date"
            name="startDate"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-11 rounded-md border border-surface/15 bg-surface/5 px-3 text-base text-surface outline-none focus-visible:border-accent"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-surface/80">
          <span>{t('endDate')}</span>
          <input
            type="date"
            name="endDate"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-11 rounded-md border border-surface/15 bg-surface/5 px-3 text-base text-surface outline-none focus-visible:border-accent"
            required
          />
        </label>
      </div>

      <fieldset className="flex flex-wrap gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-surface/15 px-4 py-2 text-sm text-surface/80 has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:text-surface">
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
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-surface/15 px-4 py-2 text-sm text-surface/80 has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:text-surface">
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

      {estimateHalalas > 0 ? (
        <p className="text-2xs text-surface/50 [lang=ar]:font-sansAr">
          {t('total', { price: formatSarFromHalalas(estimateHalalas, locale) })}
        </p>
      ) : null}

      {serverState && !serverState.ok ? (
        <p className="text-sm text-accent-secondary" role="alert">
          {serverState.error === 'UNAVAILABLE'
            ? t('unavailable')
            : serverState.error === 'NOT_AUTHENTICATED'
              ? t('needsSignIn')
              : serverState.error === 'CANNOT_BOOK_OWN'
                ? t('cannotBookOwn')
                : t('error')}
        </p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isPending}>
        {t('submit')}
      </Button>
    </form>
  );
}
