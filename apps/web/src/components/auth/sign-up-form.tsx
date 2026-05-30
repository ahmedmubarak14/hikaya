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

      <label className="text-surface/70 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          {...register('acceptedTerms')}
          className="accent-accent mt-1 h-4 w-4 cursor-pointer"
        />
        <span>
          {t.rich('acceptTerms', {
            terms: (chunks) => (
              <Link
                href={`/${locale}/terms`}
                className="text-surface decoration-accent-secondary underline decoration-2 underline-offset-4"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href={`/${locale}/privacy`}
                className="text-surface decoration-accent-secondary underline decoration-2 underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>
      {errors.acceptedTerms?.message ? (
        <p className="text-accent-secondary -mt-3 text-xs" role="alert">
          {errors.acceptedTerms.message}
        </p>
      ) : null}

      {serverState && !serverState.ok && serverState.error !== 'EMAIL_TAKEN' ? (
        <p
          className="border-accent-secondary/40 bg-accent-secondary/10 text-surface rounded-md border px-3 py-2 text-sm"
          role="alert"
        >
          {tErrors('signupFailed')}
          {process.env.NODE_ENV !== 'production' ? (
            <span className="text-muted mt-1 block font-mono text-xs">
              ({serverState.error})
            </span>
          ) : null}
        </p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isPending} className="mt-2">
        {t('signUpCta')}
      </Button>

      <p className="text-surface/60 text-center text-sm">
        {t('haveAccount')}{' '}
        <Link
          href={`/${locale}/sign-in`}
          className="text-surface decoration-accent-secondary hover:text-accent-secondary underline decoration-2 underline-offset-4"
        >
          {t('signInLink')}
        </Link>
      </p>
    </form>
  );
}

const ROLE_OPTIONS = [
  { value: 'CLIENT', labelKey: 'roleClient', hintKey: 'roleClientHint' },
  { value: 'CREATOR', labelKey: 'roleCreator', hintKey: 'roleCreatorHint' },
  { value: 'STUDIO_OWNER', labelKey: 'roleStudioOwner', hintKey: 'roleStudioOwnerHint' },
] as const;

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
      <legend className="text-surface/80 text-sm font-medium">{t('roleLabel')}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {ROLE_OPTIONS.map((opt) => {
          const Icon =
            opt.value === 'CLIENT'
              ? ClientIcon
              : opt.value === 'CREATOR'
                ? CreatorIcon
                : StudioIcon;
          return (
            <label
              key={opt.value}
              className={cn(
                'cursor-pointer rounded-md border px-4 py-3 text-sm transition-colors',
                current === opt.value
                  ? 'border-accent bg-accent/10 text-surface'
                  : 'border-surface/15 bg-surface/[0.03] text-surface/70 hover:border-surface/30',
              )}
            >
              <input type="radio" value={opt.value} {...register('role')} className="sr-only" />
              <span className="text-surface/70 mb-1 flex items-center gap-2">
                <Icon />
              </span>
              <span className="block font-medium">{t(opt.labelKey)}</span>
              <span className="text-surface/50 block text-xs">{t(opt.hintKey)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ClientIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CreatorIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <circle cx="12" cy="13.5" r="3.5" />
      <path d="M8 7l1.5-3h5L16 7" />
    </svg>
  );
}

function StudioIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 21V8l9-5 9 5v13" />
      <path d="M9 21v-6h6v6" />
      <path d="M3 21h18" />
    </svg>
  );
}
