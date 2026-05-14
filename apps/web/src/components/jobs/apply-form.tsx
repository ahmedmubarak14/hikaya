'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { applyToJobAction, type JobResult } from '@/lib/jobs/actions';
import { applyToJobSchema, type ApplyToJobValues } from '@/lib/jobs/schemas';

interface Props {
  locale: Locale;
  jobId: string;
}

export function ApplyForm({ locale, jobId }: Props) {
  const t = useTranslations('jobs.apply');

  const [serverState, formAction] = useFormState<JobResult | null, FormData>(
    applyToJobAction.bind(null, locale, jobId),
    null,
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyToJobValues>({
    resolver: zodResolver(applyToJobSchema),
    defaultValues: { coverNote: '', proposedRateSar: undefined },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('coverNote', values.coverNote);
        fd.set('proposedRateSar', String(values.proposedRateSar));
        startTransition(() => formAction(fd));
      })}
      className="flex flex-col gap-4 rounded-xl border border-accent/30 bg-accent/5 p-6"
      noValidate
    >
      <header className="flex flex-col gap-1">
        <span className="text-2xs text-accent-secondary">
          {t('label')}
        </span>
        <p className="text-sm text-surface/70">{t('hint')}</p>
      </header>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-surface/80 [lang=ar]:font-sansAr">{t('coverNote')}</span>
        <textarea
          rows={5}
          {...register('coverNote')}
          placeholder={t('coverNotePlaceholder')}
          className="rounded-md border border-surface/15 bg-bg/40 px-3 py-2 text-base text-surface outline-none focus-visible:border-accent"
        />
        {errors.coverNote?.message ? (
          <span className="text-xs text-accent-secondary">{errors.coverNote.message}</span>
        ) : null}
      </label>

      <Input
        type="number"
        inputMode="numeric"
        label={t('proposedRate')}
        hint={t('proposedRateHint')}
        {...register('proposedRateSar')}
        error={errors.proposedRateSar?.message}
      />

      {serverState?.error === 'ALREADY_APPLIED' ? (
        <p className="text-xs text-accent-secondary" role="alert">{t('errorAlready')}</p>
      ) : serverState?.error === 'NOT_CREATOR' ? (
        <p className="text-xs text-accent-secondary" role="alert">{t('errorNotCreator')}</p>
      ) : serverState?.error === 'JOB_NOT_OPEN' ? (
        <p className="text-xs text-accent-secondary" role="alert">{t('errorClosed')}</p>
      ) : serverState?.error === 'NOT_OWNER' ? (
        <p className="text-xs text-accent-secondary" role="alert">{t('errorOwnJob')}</p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isPending} className="self-start">
        {t('submit')}
      </Button>
    </form>
  );
}
