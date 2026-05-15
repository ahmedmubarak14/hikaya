'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import {
  addPortfolioItemAction,
  deletePortfolioItemAction,
  movePortfolioItemAction,
  type EditorResult,
} from '@/lib/creators/actions';
import type { PortfolioItem } from '@/lib/creators/mock-data';
import { portfolioItemAddSchema, type PortfolioItemAddValues } from '@/lib/creators/schemas';

interface Props {
  locale: Locale;
  items: PortfolioItem[];
  altPrefix: string;
}

export function PortfolioEditor({ locale, items, altPrefix }: Props) {
  const t = useTranslations('portfolioEditor.items');
  const [isPending, startTransition] = useTransition();

  const move = (itemId: string, dir: 'up' | 'down') => {
    startTransition(() => {
      void movePortfolioItemAction(locale, itemId, dir);
    });
  };

  const remove = (itemId: string) => {
    startTransition(() => {
      void deletePortfolioItemAction(locale, itemId);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <AddItemForm locale={locale} />

      {items.length === 0 ? (
        <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
          <p className="text-surface/70 text-lg">{t('empty')}</p>
          <p className="text-surface/40 mt-2 text-sm">{t('emptyHint')}</p>
        </div>
      ) : (
        <ul
          className={cn(
            'grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4',
            isPending && 'opacity-70',
          )}
          aria-busy={isPending || undefined}
        >
          {items.map((item, idx) => (
            <li key={item.id} className="group relative">
              <figure className="border-surface/10 bg-surface/5 relative aspect-[4/5] overflow-hidden rounded-md border">
                <Image
                  src={item.url}
                  alt={`${altPrefix} — ${item.titleEn ?? `${idx + 1}`}`}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
                <div className="from-bg/80 to-bg/40 pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="pointer-events-auto absolute inset-x-2 top-2 flex items-center justify-between opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <span className="bg-bg/80 text-2xs text-surface/70 rounded-full px-2 py-1 font-mono">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="bg-accent-secondary text-2xs text-surface rounded-full px-3 py-1 font-medium transition-transform hover:scale-105"
                  >
                    {t('delete')}
                  </button>
                </div>

                <div className="pointer-events-auto absolute inset-x-2 bottom-2 flex items-center justify-end gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <ReorderButton
                    direction="up"
                    label={t('moveUp')}
                    disabled={idx === 0}
                    onClick={() => move(item.id, 'up')}
                  />
                  <ReorderButton
                    direction="down"
                    label={t('moveDown')}
                    disabled={idx === items.length - 1}
                    onClick={() => move(item.id, 'down')}
                  />
                </div>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReorderButton({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: 'up' | 'down';
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'bg-bg/80 text-surface grid h-7 w-7 place-items-center rounded-full transition-colors',
        disabled ? 'cursor-not-allowed opacity-30' : 'hover:bg-accent hover:text-ink',
      )}
    >
      {/* Logical: "up" = toward start of list. In RTL the visible direction
          flips automatically because the grid is RTL too, so the arrows still
          read as start/end. */}
      <span aria-hidden className="text-xs">
        {direction === 'up' ? '↑' : '↓'}
      </span>
    </button>
  );
}

function AddItemForm({ locale }: { locale: Locale }) {
  const t = useTranslations('portfolioEditor.add');
  const [serverState, formAction] = useFormState<EditorResult | null, FormData>(
    addPortfolioItemAction.bind(null, locale),
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PortfolioItemAddValues>({
    resolver: zodResolver(portfolioItemAddSchema),
    defaultValues: { url: '', titleEn: '' },
  });

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={() => setOpen(true)}
        className="self-start"
      >
        {t('open')}
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        if (values.url) fd.set('url', values.url);
        if (values.titleEn) fd.set('titleEn', values.titleEn);
        startTransition(() => {
          formAction(fd);
          reset();
          // keep the form open so the creator can add several
        });
      })}
      className="border-surface/10 bg-surface/[0.03] flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-end"
      noValidate
    >
      <Input
        label={t('url')}
        hint={t('urlHint')}
        placeholder="https://..."
        {...register('url')}
        error={errors.url?.message}
        className="flex-1"
      />
      <Input
        label={t('titleEn')}
        {...register('titleEn')}
        error={errors.titleEn?.message}
        className="md:w-64"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="md" isLoading={isPending}>
          {t('add')}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-surface/60 hover:text-surface rounded-full px-3 py-2 text-sm transition-colors"
        >
          {t('close')}
        </button>
      </div>
      {serverState?.ok ? (
        <span className="text-2xs text-accent-secondary">{t('added')}</span>
      ) : null}
    </form>
  );
}
