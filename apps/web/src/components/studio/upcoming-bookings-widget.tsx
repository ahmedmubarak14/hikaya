'use client';

import { useLocale, useTranslations } from 'next-intl';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import type { UpcomingBooking } from '@/lib/bookings/actions';

interface Props {
  bookings: UpcomingBooking[];
}

export function UpcomingBookingsWidget({ bookings }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations('studio.upcomingWidget');

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
              <li
                key={b.id}
                className="border-surface/10 flex items-center justify-between rounded-lg border p-3"
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
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
