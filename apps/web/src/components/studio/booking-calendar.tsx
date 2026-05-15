import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import type { BookingStatus, StudioBooking } from '@/lib/studio/mock-data';

interface Props {
  bookings: StudioBooking[];
  /** Optional anchor date to drive which month is shown. Defaults to today. */
  anchor?: Date;
}

/**
 * Month-view booking calendar.
 *
 * Server component — no JS for layout, no DOM virtualisation. Bookings are
 * grouped by ISO date string and rendered as colored chips inside each cell.
 * Saturday-start week per Saudi convention; Arabic locale gets full RTL grid
 * mirroring for free.
 */
export function BookingCalendar({ bookings, anchor = new Date() }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations('studio.calendar');

  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const monthLabel = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1));

  const weekDayLabels = buildWeekdayLabels(locale);

  // Compute the visible 6-week grid starting on Saturday.
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0 = Sun
  // Offset so Saturday (6) sits at column 0.
  const offsetFromSaturday = (firstWeekday + 1) % 7;
  const gridStart = new Date(year, month, 1 - offsetFromSaturday);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }

  const byDate = groupByIsoDate(bookings);

  return (
    <section className="border-surface/10 bg-surface/[0.03] rounded-xl border p-4 md:p-6">
      <header className="mb-4 flex items-baseline justify-between">
        <h3 className="text-surface text-2xl">{monthLabel}</h3>
        <span className="text-2xs text-surface/40">{t('weekStart')}</span>
      </header>

      <div className="border-surface/10 bg-surface/10 grid grid-cols-7 gap-px overflow-hidden rounded-md border">
        {weekDayLabels.map((label) => (
          <div key={label} className="bg-bg text-2xs text-surface/40 p-2 text-center">
            {label}
          </div>
        ))}

        {cells.map((d) => {
          const inMonth = d.getMonth() === month;
          const isToday = isSameDay(d, anchor);
          const iso = toIsoDate(d);
          const dayBookings = byDate.get(iso) ?? [];
          return (
            <div
              key={iso}
              className={cn(
                'bg-bg min-h-24 p-2',
                !inMonth && 'opacity-40',
                isToday && 'bg-accent/[0.08]',
              )}
            >
              <div
                className={cn(
                  'text-2xs mb-1 font-mono',
                  isToday ? 'text-accent-secondary' : 'text-surface/50',
                )}
              >
                {new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA').format(d.getDate())}
              </div>
              <ul className="flex flex-col gap-1">
                {dayBookings.slice(0, 3).map((b) => (
                  <li key={b.id}>
                    <BookingChip booking={b} />
                  </li>
                ))}
                {dayBookings.length > 3 ? (
                  <li className="text-2xs text-surface/40 font-mono">+{dayBookings.length - 3}</li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  INQUIRY: 'bg-surface/10 text-surface/80',
  QUOTED: 'bg-info/20 text-info',
  CONTRACTED: 'bg-purple/20 text-purple',
  CONFIRMED: 'bg-sage/20 text-sage',
  IN_PROGRESS: 'bg-accent/20 text-accent-secondary',
  DELIVERED: 'bg-accent/15 text-accent-secondary',
  COMPLETED: 'bg-surface/10 text-surface/60',
  CANCELLED: 'bg-accent-secondary/20 text-accent-secondary line-through',
};

function BookingChip({ booking }: { booking: StudioBooking }) {
  return (
    <span
      title={`${booking.clientName} · ${booking.discipline}`}
      className={cn(
        'text-2xs block truncate rounded px-1.5 py-0.5 font-medium',
        STATUS_COLORS[booking.status],
      )}
    >
      {booking.clientName}
    </span>
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

function groupByIsoDate(bookings: StudioBooking[]): Map<string, StudioBooking[]> {
  const map = new Map<string, StudioBooking[]>();
  for (const b of bookings) {
    const iso = toIsoDate(new Date(b.sessionStart));
    const existing = map.get(iso);
    if (existing) existing.push(b);
    else map.set(iso, [b]);
  }
  return map;
}

function buildWeekdayLabels(locale: Locale): string[] {
  // Saturday-start. Use a fixed reference Saturday and increment by day.
  const ref = new Date(2024, 0, 6); // 2024-01-06 was a Saturday
  const fmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', { weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ref);
    d.setDate(ref.getDate() + i);
    return fmt.format(d);
  });
}
