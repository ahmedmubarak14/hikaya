'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { signInAction, type AuthFailure } from '@/lib/auth/actions';
import { signInFormSchema, type SignInFormValues } from '@/lib/auth/schemas';

interface Props {
  locale: Locale;
}

export function SignInForm({ locale }: Props) {
  const t = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');

  const [serverState, formAction] = useFormState<AuthFailure | null, FormData>(
    signInAction.bind(null, locale),
    null,
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('email', values.email);
        fd.set('password', values.password);
        startTransition(() => formAction(fd));
      })}
      className="flex w-full flex-col gap-5"
      noValidate
    >
      <Input
        label={t('email')}
        type="email"
        autoComplete="email"
        {...register('email')}
        error={errors.email?.message}
        required
      />
      <Input
        label={t('password')}
        type="password"
        autoComplete="current-password"
        {...register('password')}
        error={errors.password?.message}
        required
      />

      {serverState?.error === 'INVALID_CREDENTIALS' ? (
        <p className="text-accent-secondary text-sm" role="alert">
          {tErrors('invalidCredentials')}
        </p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isPending} className="mt-2">
        {t('signInCta')}
      </Button>

      <p className="text-surface/60 text-center text-sm">
        {t('noAccount')}{' '}
        <Link
          href={`/${locale}/sign-up`}
          className="text-surface decoration-accent-secondary hover:text-accent-secondary underline decoration-2 underline-offset-4"
        >
          {t('signUpLink')}
        </Link>
      </p>
    </form>
  );
}
