'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import {
  signAsClientAction,
  signAsCreatorAction,
  type ContractResult,
} from '@/lib/contracts/actions';
import { signContractSchema, type SignContractValues } from '@/lib/contracts/schemas';

interface Props {
  locale: Locale;
  /** "creator" → bind to creator action with contractId; "client" → bind to client action with shareSlug. */
  side: 'creator' | 'client';
  contractRef: string; // contractId for creator, shareSlug for client
  defaultName: string;
}

/**
 * Typed-name signature block used by both sides. The PRD calls for typed
 * signatures (not drawn) in Phase 1, validated against the user's display
 * name. We surface the typed name and an explicit terms checkbox so the
 * audit log captures intent.
 */
export function SignForm({ locale, side, contractRef, defaultName }: Props) {
  const t = useTranslations('contracts.sign');

  const action =
    side === 'creator'
      ? signAsCreatorAction.bind(null, locale, contractRef)
      : signAsClientAction.bind(null, locale, contractRef);

  const [serverState, formAction] = useFormState<ContractResult | null, FormData>(action, null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignContractValues>({
    resolver: zodResolver(signContractSchema),
    defaultValues: { typedName: defaultName, acceptedTerms: false as unknown as true },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('typedName', values.typedName);
        if (values.acceptedTerms) fd.set('acceptedTerms', 'on');
        startTransition(() => formAction(fd));
      })}
      className="flex flex-col gap-4 rounded-xl border border-accent/30 bg-accent/5 p-6"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <span className="font-mono text-2xs uppercase tracking-widest text-accent [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
          {t('label')}
        </span>
        <p className="text-sm text-surface/70">{t('hint')}</p>
      </div>

      <Input
        label={t('typedName')}
        {...register('typedName')}
        error={errors.typedName?.message}
        required
      />

      <label className="flex cursor-pointer items-start gap-3 text-sm text-surface/80">
        <input type="checkbox" {...register('acceptedTerms')} className="mt-0.5 h-4 w-4 accent-accent" />
        <span>{t('acceptTerms')}</span>
      </label>
      {errors.acceptedTerms?.message ? (
        <p className="text-xs text-accent-secondary">{errors.acceptedTerms.message}</p>
      ) : null}

      {serverState?.error === 'ALREADY_SIGNED' ? (
        <p className="text-xs text-accent-secondary" role="alert">{t('errorAlready')}</p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isPending} className="self-start">
        {t('submit')}
      </Button>
    </form>
  );
}
