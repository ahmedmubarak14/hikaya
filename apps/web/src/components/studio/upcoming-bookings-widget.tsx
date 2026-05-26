'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { BookingDetailPanel } from '@/components/studio/booking-detail-panel';
import { type Locale } from '@/i18n/config';
import type { UpcomingBooking } from '@/lib/bookings/actions';

interface Props {
  bookings: UpcomingBooking[];
}

export function UpcomingBookingsWidget({ bookings }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations('studio.upcomingWidget');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (bookings.length === 0) {
    return (
      <Card>
        <CardBody className="p-6">
          <h3 className="text-surface mb-2 text-lg">{t('title')}</h3>
          <p className="text-surface/50 text-sm">{t('empty')}</p>
        </CardBody>
      </Card>
    );
  }

  const selected = bookings.find((b) => b.id === selectedId);

  return (
    <Card>
      <CardBody className="flex flex-col gap-4 p-6">
        <h3 className="text-surface text-lg">{t('title')}</h3>
        <ul className="flex flex-col gap-3">
          {bookings.map((b) => {
            const d = new Date(b.sessionStart);
            const dateStr = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }).format(d);

            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(selectedId === b.id ? null : b.id)}
                  className="border-surface/10 hover:border-surface/20 flex w-full items-center justify-between rounded-lg border p-3 text-start transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-surface text-sm">{b.clientName}</span>
                    <span className="text-2xs text-surface/40">
                      {dateStr} &middot; {b.discipline.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <Badge
                    tone={b.daysUntil <= 1 ? 'accent' : b.daysUntil <= 7 ? 'warning' : 'neutral'}
                  >
                    {b.daysUntil === 0
                      ? t('today')
                      : b.daysUntil === 1
                        ? t('tomorrow')
                        : t('daysUntil', { count: b.daysUntil })}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Booking detail panel */}
        {selected ? (
          <BookingDetailPanel
            bookingId={selected.id}
            clientName={selected.clientName}
            discipline={selected.discipline}
            status={selected.status}
            sessionStart={selected.sessionStart}
            city={selected.city}
          />
        ) : null}
      </CardBody>
    </Card>
  );
}
