'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Badge, Button, Input } from '@hikaya/ui';

import {
  updateAvailabilityStatusAction,
  updateBlockedDatesAction,
  type AvailabilityStatus,
  type BlockedDateRange,
} from '@/lib/availability/actions';

interface Props {
  initialStatus: AvailabilityStatus;
  initialBlockedDates: BlockedDateRange[];
}

const STATUS_OPTIONS: AvailabilityStatus[] = ['AVAILABLE', 'BUSY', 'ON_VACATION'];

const STATUS_TONE: Record<AvailabilityStatus, 'sage' | 'warning' | 'accent'> = {
  AVAILABLE: 'sage',
  BUSY: 'warning',
  ON_VACATION: 'accent',
};

export function AvailabilityForm({ initialStatus, initialBlockedDates }: Props) {
  const t = useTranslations('availability');
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<AvailabilityStatus>(initialStatus);
  const [blockedDates, setBlockedDates] = useState<BlockedDateRange[]>(initialBlockedDates);
  const [saved, setSaved] = useState(false);

  // New blocked date form
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newReason, setNewReason] = useState('');

  const handleStatusChange = (newStatus: AvailabilityStatus) => {
    setStatus(newStatus);
    setSaved(false);
    startTransition(async () => {
      const result = await updateAvailabilityStatusAction(newStatus);
      if (result.ok) setSaved(true);
    });
  };

  const handleAddBlockedDate = () => {
    if (!newStart || !newEnd) return;
    const newRange: BlockedDateRange = {
      start: newStart,
      end: newEnd,
      reason: newReason || undefined,
    };
    const updated = [...blockedDates, newRange];
    setBlockedDates(updated);
    setNewStart('');
    setNewEnd('');
    setNewReason('');
    setSaved(false);

    startTransition(async () => {
      const result = await updateBlockedDatesAction(updated);
      if (result.ok) setSaved(true);
    });
  };

  const handleRemoveBlockedDate = (index: number) => {
    const updated = blockedDates.filter((_, i) => i !== index);
    setBlockedDates(updated);
    setSaved(false);

    startTransition(async () => {
      const result = await updateBlockedDatesAction(updated);
      if (result.ok) setSaved(true);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Status toggle */}
      <section>
        <h2 className="text-surface mb-4 text-xl">{t('statusTitle')}</h2>
        <p className="text-surface/60 mb-4 text-sm">{t('statusSubtitle')}</p>
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleStatusChange(opt)}
              disabled={isPending}
              className={`rounded-full border px-5 py-2.5 text-sm transition-colors ${
                status === opt
                  ? 'border-accent bg-accent/10 text-accent-secondary font-medium'
                  : 'border-surface/15 text-surface/60 hover:border-surface/40 hover:text-surface'
              }`}
            >
              <span className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[opt]}>{t(`status.${opt}`)}</Badge>
              </span>
            </button>
          ))}
        </div>
        {saved && (
          <p className="text-accent-secondary mt-3 text-xs">{t('saved')}</p>
        )}
      </section>

      {/* Blocked dates */}
      <section>
        <h2 className="text-surface mb-4 text-xl">{t('blockedDatesTitle')}</h2>
        <p className="text-surface/60 mb-4 text-sm">{t('blockedDatesSubtitle')}</p>

        {/* Existing blocked dates */}
        {blockedDates.length > 0 && (
          <ul className="mb-4 flex flex-col gap-2">
            {blockedDates.map((d, i) => (
              <li
                key={`${d.start}-${d.end}-${i}`}
                className="border-surface/10 flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-surface text-sm">
                    {new Date(d.start).toLocaleDateString()} &mdash;{' '}
                    {new Date(d.end).toLocaleDateString()}
                  </span>
                  {d.reason && (
                    <span className="text-surface/40 text-xs">{d.reason}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveBlockedDate(i)}
                  disabled={isPending}
                >
                  {t('remove')}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Add new blocked date */}
        <div className="border-surface/10 rounded-xl border p-4">
          <h4 className="text-surface mb-3 text-sm font-medium">{t('addBlockedDate')}</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              label={t('startDate')}
              type="date"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
            />
            <Input
              label={t('endDate')}
              type="date"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
            />
            <Input
              label={t('reason')}
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleAddBlockedDate}
            isLoading={isPending}
            disabled={!newStart || !newEnd}
          >
            {t('addDate')}
          </Button>
        </div>
      </section>
    </div>
  );
}
