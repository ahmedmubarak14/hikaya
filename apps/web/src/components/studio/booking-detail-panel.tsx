'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Badge, Button, Input } from '@hikaya/ui';

import {
  rescheduleBookingAction,
  cancelBookingAction,
} from '@/lib/bookings/actions';

interface Props {
  bookingId: string;
  clientName: string;
  discipline: string;
  status: string;
  sessionStart: string;
  city: string;
}

export function BookingDetailPanel({
  bookingId,
  clientName,
  discipline,
  status,
  sessionStart,
  city,
}: Props) {
  const t = useTranslations('bookingDetail');
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'view' | 'reschedule' | 'cancel'>('view');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('14:00');
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isCancelled = status === 'CANCELLED';
  const isCompleted = status === 'COMPLETED';
  const isModifiable = !isCancelled && !isCompleted;

  const handleReschedule = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await rescheduleBookingAction(bookingId, newDate, newTime);
      if (result.ok) {
        setSuccess('rescheduled');
        setMode('view');
      } else {
        setError(result.error);
      }
    });
  };

  const handleCancel = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await cancelBookingAction(bookingId, cancelReason);
      if (result.ok) {
        setSuccess('cancelled');
        setMode('view');
      } else {
        setError(result.error);
      }
    });
  };

  const sessionDate = new Date(sessionStart);

  return (
    <div className="border-surface/10 bg-surface/[0.03] flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-surface text-lg font-medium">{clientName}</h3>
        <Badge tone={isCancelled ? 'warning' : isCompleted ? 'neutral' : 'sage'}>
          {t(`status.${status}` as 'status.CONFIRMED')}
        </Badge>
      </div>

      <dl className="text-surface/70 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-surface/50">{t('discipline')}</dt>
        <dd>{discipline}</dd>
        <dt className="text-surface/50">{t('sessionDate')}</dt>
        <dd>{sessionDate.toLocaleDateString()} {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</dd>
        <dt className="text-surface/50">{t('city')}</dt>
        <dd>{city}</dd>
      </dl>

      {/* Cancellation policy */}
      <div className="border-surface/10 rounded-lg border p-3">
        <span className="text-surface/50 text-xs font-medium">{t('cancellationPolicyTitle')}</span>
        <p className="text-surface/60 mt-1 text-xs">{t('cancellationPolicyText')}</p>
      </div>

      {/* Action buttons */}
      {isModifiable && mode === 'view' ? (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setMode('reschedule')}
          >
            {t('reschedule')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setMode('cancel')}
          >
            {t('cancelBooking')}
          </Button>
        </div>
      ) : null}

      {/* Reschedule form */}
      {mode === 'reschedule' ? (
        <div className="border-accent/30 bg-accent/5 flex flex-col gap-3 rounded-lg border p-4">
          <span className="text-2xs text-accent-secondary">{t('rescheduleTitle')}</span>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('newDate')}
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
            <Input
              label={t('newTime')}
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleReschedule} isLoading={isPending}>
              {t('confirmReschedule')}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setMode('view')}>
              {t('back')}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Cancel form */}
      {mode === 'cancel' ? (
        <div className="border-accent-secondary/30 bg-accent-secondary/5 flex flex-col gap-3 rounded-lg border p-4">
          <span className="text-2xs text-accent-secondary">{t('cancelTitle')}</span>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t('cancelReasonPlaceholder')}
            rows={3}
            className="border-surface/15 bg-bg text-surface w-full rounded-lg border px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleCancel} isLoading={isPending}>
              {t('confirmCancel')}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setMode('view')}>
              {t('back')}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-accent-secondary text-xs">{t('error')}</p>
      ) : null}
      {success === 'rescheduled' ? (
        <p className="text-sage text-xs">{t('rescheduledSuccess')}</p>
      ) : null}
      {success === 'cancelled' ? (
        <p className="text-sage text-xs">{t('cancelledSuccess')}</p>
      ) : null}
    </div>
  );
}
