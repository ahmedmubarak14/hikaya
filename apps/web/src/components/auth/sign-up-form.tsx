'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { signUpAction, type AuthFailure } from '@/lib/auth/actions';
import { signUpFormSchema, type SignUpFormValues } from '@/lib/auth/schemas';

interface Props {
  locale: Locale;
}

export function SignUpForm({ locale }: Props) {
  const t = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');

  const [serverState, formAction] = useFormState<AuthFailure | null, FormData>(
    signUpAction.bind(null, locale),
    null,
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      role: 'CLIENT',
      locale,
      acceptedTerms: false as unknown as true,
    },
  });

  const role = watch('role');

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('displayName', values.displayName);
        fd.set('email', values.email);
        fd.set('password', values.password);
        fd.set('role', values.role);
        fd.set('locale', values.locale);
        if (values.acceptedTerms) fd.set('acceptedTerms', 'on');
        startTransition(() => formAction(fd));
      })}
      className="flex w-full flex-col gap-5"
      noValidate
    >
      <RoleToggle current={role} register={register} />

      <Input
        label={t('displayName')}
        autoComplete="name"
        {...register('displayName')}
        error={errors.displayName?.message}
        required
      />
      <Input
        label={t('email')}
        type="email"
        autoComplete="email"
        {...register('email')}
        error={
          errors.email?.message ??
          (serverState?.fieldErrors?.email === 'EMAIL_TAKEN' ? tErrors('emailTaken') : undefined)
        }
        required
      />
      <Input
        label={t('password')}
        type="password"
        autoComplete="new-password"
        hint={t('passwordHint')}
        {...register('password')}
        error={errors.password?.message}
        required
      />

      <label className="flex items-start gap-3 text-sm text-surface/70">
        <input
          type="checkbox"
          {...register('acceptedTerms')}
          className="mt-1 h-4 w-4 cursor-pointer accent-accent"
        />
        <span>
          {t.rich('acceptTerms', {
            terms: (chunks) => (
              <Link
                href={`/${locale}/terms`}
                className="text-surface underline decoration-accent decoration-2 underline-offset-4"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href={`/${locale}/privacy`}
                className="text-surface underline decoration-accent decoration-2 underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>
      {errors.acceptedTerms?.message ? (
        <p className="-mt-3 text-xs text-accent-secondary" role="alert">
          {errors.acceptedTerms.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isPending} className="mt-2">
        {t('signUpCta')}
      </Button>

      <p className="text-center text-sm text-surface/60">
        {t('haveAccount')}{' '}
        <Link
          href={`/${locale}/sign-in`}
          className="text-surface underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
        >
          {t('signInLink')}
        </Link>
      </p>
    </form>
  );
}

function RoleToggle({
  current,
  register,
}: {
  current: SignUpFormValues['role'];
  register: ReturnType<typeof useForm<SignUpFormValues>>['register'];
}) {
  const t = useTranslations('auth');
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-surface/80">{t('roleLabel')}</legend>
      <div className="grid grid-cols-2 gap-2">
        {(['CLIENT', 'CREATOR'] as const).map((value) => (
          <label
            key={value}
            className={cn(
              'cursor-pointer rounded-md border px-4 py-3 text-sm transition-colors',
              current === value
                ? 'border-accent bg-accent/10 text-surface'
                : 'border-surface/15 bg-surface/[0.03] text-surface/70 hover:border-surface/30',
            )}
          >
            <input type="radio" value={value} {...register('role')} className="sr-only" />
            <span className="block font-medium">
              {t(value === 'CLIENT' ? 'roleClient' : 'roleCreator')}
            </span>
            <span className="block text-xs text-surface/50">
              {t(value === 'CLIENT' ? 'roleClientHint' : 'roleCreatorHint')}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
