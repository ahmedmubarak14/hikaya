'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { formatDateTime, formatSarFromHalalas } from '@/lib/format';
import type { SpaceAddOn, SpaceBooking } from '@/lib/spaces/mock-data';
import {
  checkInAction,
  checkOutAction,
  addConditionPhotoAction,
} from '@/lib/spaces/actions';

interface Props {
  locale: Locale;
  booking: SpaceBooking;
}

export function CheckInOutPanel({ locale, booking }: Props) {
  const t = useTranslations('spaces.rentals.detail');
  const [isPending, startTransition] = useTransition();
  const [photoUrl, setPhotoUrl] = useState('');
  const [checkOutPhotoUrl, setCheckOutPhotoUrl] = useState('');

  const canCheckIn =
    booking.status === 'CONFIRMED' && !booking.checkInAt;
  const canCheckOut =
    booking.status === 'CONFIRMED' && !!booking.checkInAt && !booking.checkOutAt;
  const isCheckedIn = !!booking.checkInAt;
  const isCheckedOut = !!booking.checkOutAt;

  const handleCheckIn = () => {
    startTransition(async () => {
      await checkInAction(locale, booking.id);
    });
  };

  const handleCheckOut = () => {
    startTransition(async () => {
      await checkOutAction(locale, booking.id);
    });
  };

  const handleAddCheckInPhoto = () => {
    if (!photoUrl.trim()) return;
    startTransition(async () => {
      await addConditionPhotoAction(locale, booking.id, 'checkIn', photoUrl.trim());
      setPhotoUrl('');
    });
  };

  const handleAddCheckOutPhoto = () => {
    if (!checkOutPhotoUrl.trim()) return;
    startTransition(async () => {
      await addConditionPhotoAction(locale, booking.id, 'checkOut', checkOutPhotoUrl.trim());
      setCheckOutPhotoUrl('');
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Check-in / Check-out buttons */}
      <div className="border-surface/10 flex flex-col gap-3 border-t pt-4">
        {isCheckedIn ? (
          <p className="text-sage text-sm">
            {t('checkedInAt', { time: formatDateTime(booking.checkInAt!, locale) })}
          </p>
        ) : null}

        {isCheckedOut ? (
          <p className="text-sage text-sm">
            {t('checkedOutAt', { time: formatDateTime(booking.checkOutAt!, locale) })}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canCheckIn ? (
            <Button
              size="md"
              variant="primary"
              onClick={handleCheckIn}
              isLoading={isPending}
            >
              {t('checkIn')}
            </Button>
          ) : null}

          {canCheckOut ? (
            <Button
              size="md"
              variant="primary"
              onClick={handleCheckOut}
              isLoading={isPending}
            >
              {t('checkOut')}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Selected add-ons */}
      {booking.selectedAddOns.length > 0 ? (
        <div className="border-surface/10 border-t pt-4">
          <h3 className="text-surface mb-2 text-sm font-semibold">{t('selectedAddOns')}</h3>
          <ul className="flex flex-col gap-1">
            {booking.selectedAddOns.map((addon: SpaceAddOn, idx: number) => (
              <li key={idx} className="text-surface/70 flex justify-between text-sm">
                <span>{addon.name}</span>
                <span className="font-mono tabular-nums">
                  {addon.priceHalalas > 0
                    ? formatSarFromHalalas(addon.priceHalalas, locale)
                    : '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Condition photos */}
      <div className="border-surface/10 border-t pt-4">
        <h3 className="text-surface mb-3 text-sm font-semibold">
          {t('conditionPhotosTitle')}
        </h3>

        {/* Check-in photos */}
        {isCheckedIn ? (
          <div className="mb-4">
            <p className="text-2xs text-surface/50 mb-2">{t('checkInPhotosLabel')}</p>
            {booking.checkInPhotos.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {booking.checkInPhotos.map((url, idx) => (
                  <li key={idx}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent text-xs underline-offset-4 hover:underline"
                    >
                      Photo {idx + 1}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-surface/40 text-xs">{t('noPhotos')}</p>
            )}
            {!isCheckedOut ? (
              <div className="mt-2 flex gap-2">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder={t('addPhotoPlaceholder')}
                  className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-9 flex-1 rounded-md border px-3 text-sm outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddCheckInPhoto}
                  disabled={!photoUrl.trim() || isPending}
                >
                  {t('addPhoto')}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Check-out photos */}
        {isCheckedOut ? (
          <div>
            <p className="text-2xs text-surface/50 mb-2">{t('checkOutPhotosLabel')}</p>
            {booking.checkOutPhotos.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {booking.checkOutPhotos.map((url, idx) => (
                  <li key={idx}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent text-xs underline-offset-4 hover:underline"
                    >
                      Photo {idx + 1}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-surface/40 text-xs">{t('noPhotos')}</p>
            )}
            <div className="mt-2 flex gap-2">
              <input
                type="url"
                value={checkOutPhotoUrl}
                onChange={(e) => setCheckOutPhotoUrl(e.target.value)}
                placeholder={t('addPhotoPlaceholder')}
                className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-9 flex-1 rounded-md border px-3 text-sm outline-none"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddCheckOutPhoto}
                disabled={!checkOutPhotoUrl.trim() || isPending}
              >
                {t('addPhoto')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
