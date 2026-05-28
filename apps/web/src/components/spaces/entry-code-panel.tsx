'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  /** 6-digit code generated at booking time. */
  accessCode: string | null;
  /** ISO datetime — booking window start. */
  startISO: string;
  /** ISO datetime — booking window end. */
  endISO: string;
  /** Booking status. Only CONFIRMED bookings can reveal a code. */
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

/** Reveal a 30-minute grace window on either side of the booking. */
const GRACE_MS = 30 * 60 * 1000;

/**
 * Renders the booking access code, gated by the booking window. The renter
 * only sees the code in the window `[start - 30min, end + 30min]` and only
 * after the host has CONFIRMED the booking — so a stolen booking link can't
 * leak the code outside the time the renter actually needs it.
 *
 * Updates every minute so the "available in X" countdown stays fresh
 * without polling.
 */
export function EntryCodePanel({ accessCode, startISO, endISO, status }: Props) {
  const t = useTranslations('spaces.entryCode');
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!accessCode) return null;

  const startMs = Date.parse(startISO);
  const endMs = Date.parse(endISO);
  const windowOpen = now >= startMs - GRACE_MS && now <= endMs + GRACE_MS;
  const inFuture = now < startMs - GRACE_MS;

  // Status guard: only CONFIRMED bookings reveal the code.
  if (status !== 'CONFIRMED') {
    return (
      <section className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
        <h3 className="text-surface text-base font-semibold">{t('title')}</h3>
        <p className="text-surface/60 mt-2 text-sm">
          {status === 'PENDING'
            ? t('pendingConfirmation')
            : status === 'CANCELLED'
              ? t('cancelled')
              : t('completed')}
        </p>
      </section>
    );
  }

  if (inFuture) {
    const hoursUntil = Math.max(1, Math.round((startMs - GRACE_MS - now) / (60 * 60 * 1000)));
    return (
      <section className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
        <h3 className="text-surface text-base font-semibold">{t('title')}</h3>
        <p className="text-surface/60 mt-2 text-sm">
          {t('availableIn', { hours: hoursUntil })}
        </p>
      </section>
    );
  }

  if (!windowOpen) {
    return (
      <section className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
        <h3 className="text-surface text-base font-semibold">{t('title')}</h3>
        <p className="text-surface/60 mt-2 text-sm">{t('expired')}</p>
      </section>
    );
  }

  return (
    <section className="border-accent/30 bg-accent/5 rounded-xl border p-5">
      <h3 className="text-surface text-base font-semibold">{t('title')}</h3>
      <p className="text-surface/60 mt-1 text-xs">{t('subtitle')}</p>
      <p className="text-surface mt-3 font-mono text-4xl font-semibold tracking-[0.3em] tabular-nums">
        {accessCode}
      </p>
      <p className="text-surface/40 text-2xs mt-3">{t('windowHint')}</p>
    </section>
  );
}
