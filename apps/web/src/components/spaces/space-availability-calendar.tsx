'use client';

import { useCallback, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import type { SpaceBooking } from '@/lib/spaces/mock-data';

interface Props {
  bookings: SpaceBooking[];
}

/**
 * Read-only month calendar highlighting booked dates for a space.
 * Renters see which days are taken before picking their dates.
 */
export function SpaceAvailabilityCalendar({ bookings }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations('spaces.detail');

  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1));

  const weekDayLabels = useMemo(() => buildWeekdayLabels(locale), [locale]);

  const monthCells = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = firstOfMonth.getDay();
    // Saudi week starts Saturday
    const offsetFromSaturday = (firstWeekday + 1) % 7;
    const gridStart = new Date(year, month, 1 - offsetFromSaturday);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [year, month]);

  const bookedDates = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) {
      if (b.status === 'CANCELLED') continue;
      const start = new Date(b.startISO);
      const end = new Date(b.endISO);
      const d = new Date(start);
      while (d < end) {
        set.add(toIsoDate(d));
        d.setDate(d.getDate() + 1);
      }
    }
    return set;
  }, [bookings]);

  const navigatePrev = useCallback(() => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  }, [currentDate]);

  const navigateNext = useCallback(() => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  }, [currentDate]);

  return (
    <section className="border-surface/10 bg-surface/[0.03] rounded-xl border p-4 md:p-6">
      <header className="mb-4 flex items-center gap-2">
        <button
          onClick={navigatePrev}
          className="text-surface/60 hover:text-surface flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/5"
          aria-label={t('calendarPrev')}
        >
          <ChevronLeft />
        </button>
        <h3 className="text-surface min-w-[160px] text-center text-lg font-semibold md:text-xl">
          {monthLabel}
        </h3>
        <button
          onClick={navigateNext}
          className="text-surface/60 hover:text-surface flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/5"
          aria-label={t('calendarNext')}
        >
          <ChevronRight />
        </button>
      </header>

      <div className="border-surface/10 bg-surface/10 grid grid-cols-7 gap-px overflow-hidden rounded-md border">
        {weekDayLabels.map((label) => (
          <div key={label} className="bg-bg text-2xs text-surface/40 p-2 text-center">
            {label}
          </div>
        ))}

        {monthCells.map((d) => {
          const inMonth = d.getMonth() === month;
          const isToday = isSameDay(d, new Date());
          const iso = toIsoDate(d);
          const isBooked = bookedDates.has(iso);
          return (
            <div
              key={iso}
              className={cn(
                'bg-bg min-h-10 p-2',
                !inMonth && 'opacity-30',
                isToday && 'bg-accent/[0.08]',
                isBooked && inMonth && 'bg-accent-secondary/10',
              )}
            >
              <div
                className={cn(
                  'text-2xs font-mono',
                  isToday ? 'text-accent-secondary' : 'text-surface/50',
                )}
              >
                {new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA').format(d.getDate())}
              </div>
              {isBooked && inMonth ? (
                <div className="text-accent-secondary mt-0.5 text-[10px] font-medium">
                  {t('calendarBooked')}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-accent-secondary/20 inline-block h-3 w-3 rounded" />
          <span className="text-surface/50">{t('calendarBooked')}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-bg border-surface/10 inline-block h-3 w-3 rounded border" />
          <span className="text-surface/50">{t('calendarAvailable')}</span>
        </span>
      </div>
    </section>
  );
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildWeekdayLabels(locale: Locale): string[] {
  const ref = new Date(2024, 0, 6); // 2024-01-06 was a Saturday
  const fmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', { weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ref);
    d.setDate(ref.getDate() + i);
    return fmt.format(d);
  });
}
