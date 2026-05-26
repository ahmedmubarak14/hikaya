'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';

import { Button, Input, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import {
  createDiscountAction,
  deleteDiscountAction,
  updateDiscountAction,
  type EditorResult,
} from '@/lib/creators/actions';

export interface DiscountData {
  id: string;
  code: string;
  percentageOff: number | null;
  amountOffHalalas: number | null;
  minOrderHalalas: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Props {
  locale: Locale;
  discounts: DiscountData[];
}

export function DiscountManager({ locale, discounts }: Props) {
  const t = useTranslations('discounts');
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {!showForm ? (
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => setShowForm(true)}
          className="self-start"
        >
          {t('newCta')}
        </Button>
      ) : (
        <CreateDiscountForm locale={locale} onClose={() => setShowForm(false)} />
      )}

      {discounts.length === 0 ? (
        <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
          <p className="text-surface/70 text-lg">{t('empty')}</p>
          <p className="text-surface/40 mt-2 text-sm">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {discounts.map((d) => (
            <DiscountRow key={d.id} locale={locale} discount={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateDiscountForm({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const t = useTranslations('discounts.form');
  const [serverState, formAction] = useFormState<EditorResult | null, FormData>(
    createDiscountAction.bind(null, locale),
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set('discountType', discountType);
        startTransition(() => {
          formAction(fd);
        });
      }}
      className="border-surface/10 bg-surface/[0.03] flex flex-col gap-4 rounded-xl border p-6"
    >
      <h3 className="text-surface text-lg font-semibold">{t('createTitle')}</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label={t('code')} name="code" placeholder="SUMMER20" required />

        <div className="flex flex-col gap-1.5">
          <label className="text-surface/70 text-sm">{t('type')}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDiscountType('percentage')}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-colors',
                discountType === 'percentage'
                  ? 'border-accent/40 bg-accent/10 text-accent-secondary'
                  : 'border-surface/15 text-surface/70 hover:border-surface/40',
              )}
            >
              {t('typePercentage')}
            </button>
            <button
              type="button"
              onClick={() => setDiscountType('fixed')}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-colors',
                discountType === 'fixed'
                  ? 'border-accent/40 bg-accent/10 text-accent-secondary'
                  : 'border-surface/15 text-surface/70 hover:border-surface/40',
              )}
            >
              {t('typeFixed')}
            </button>
          </div>
        </div>

        <Input
          label={discountType === 'percentage' ? t('amountPercent') : t('amountFixed')}
          name="amount"
          type="number"
          min={1}
          max={discountType === 'percentage' ? 100 : undefined}
          required
        />

        <Input
          label={t('maxUses')}
          name="maxUses"
          type="number"
          min={1}
          hint={t('maxUsesHint')}
        />

        <Input
          label={t('expiresInDays')}
          name="expiresInDays"
          type="number"
          min={1}
          max={365}
          hint={t('expiresInDaysHint')}
        />

        <Input
          label={t('minOrder')}
          name="minOrderHalalas"
          type="number"
          min={0}
          hint={t('minOrderHint')}
        />
      </div>

      {serverState && !serverState.ok && serverState.fieldErrors && (
        <p className="text-accent-secondary text-sm">
          {Object.values(serverState.fieldErrors).join(', ')}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" size="md" isLoading={isPending}>
          {t('create')}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="text-surface/60 hover:text-surface rounded-full px-3 py-2 text-sm transition-colors"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

function DiscountRow({ locale, discount: d }: { locale: Locale; discount: DiscountData }) {
  const t = useTranslations('discounts');
  const [isPending, startTransition] = useTransition();

  const toggleActive = () => {
    const fd = new FormData();
    fd.set('isActive', String(!d.isActive));
    if (d.maxUses) fd.set('maxUses', String(d.maxUses));
    startTransition(() => {
      void updateDiscountAction(locale, d.id, fd);
    });
  };

  const remove = () => {
    if (!window.confirm(t('deleteConfirm'))) return;
    startTransition(() => {
      void deleteDiscountAction(locale, d.id);
    });
  };

  const discountLabel = d.percentageOff
    ? `${d.percentageOff}%`
    : d.amountOffHalalas
      ? `SAR ${(d.amountOffHalalas / 100).toFixed(0)}`
      : '—';

  const isExpired = d.expiresAt ? new Date(d.expiresAt) < new Date() : false;

  return (
    <div
      className={cn(
        'border-surface/10 bg-surface/[0.03] flex flex-col gap-3 rounded-xl border p-5 md:flex-row md:items-center md:justify-between',
        isPending && 'opacity-60',
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <code className="text-surface bg-surface/[0.06] rounded px-2 py-0.5 font-mono text-sm font-semibold">
            {d.code}
          </code>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              d.isActive && !isExpired
                ? 'bg-sage/15 text-sage'
                : 'bg-accent-secondary/15 text-accent-secondary',
            )}
          >
            {isExpired ? t('statusExpired') : d.isActive ? t('statusActive') : t('statusInactive')}
          </span>
        </div>
        <div className="text-surface/60 flex flex-wrap items-center gap-3 text-sm">
          <span>{t('discountAmount')}: {discountLabel}</span>
          <span>{t('used')}: {d.usedCount}{d.maxUses ? ` / ${d.maxUses}` : ''}</span>
          {d.expiresAt ? (
            <span>
              {t('expires')}: {new Date(d.expiresAt).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleActive}
          disabled={isPending}
          className={cn(
            'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
            d.isActive
              ? 'border-surface/20 text-surface/70 hover:border-surface/40'
              : 'border-accent/40 bg-accent/10 text-accent-secondary hover:bg-accent/15',
          )}
        >
          {d.isActive ? t('deactivate') : t('activate')}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          className="text-accent-secondary hover:text-accent-secondary/80 text-xs font-medium transition-colors"
        >
          {t('delete')}
        </button>
      </div>
    </div>
  );
}
