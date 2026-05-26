import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Logo } from '@hikaya/ui';

import { AppleSignInButton } from '@/components/auth/apple-sign-in-button';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { SignInForm } from '@/components/auth/sign-in-form';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('signInTitle') };
}

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (session) redirect(`/${locale}/me`);

  const t = await getTranslations('auth');

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-6 md:px-10">
        <Link href={`/${locale}`} aria-label="Hikaya" className="inline-flex">
          <Logo arabic={locale === 'ar'} className="h-6" />
        </Link>
        <Link href={`/${locale}/sign-up`} className="text-surface/70 hover:text-surface text-sm">
          {t('noAccount')} <span className="text-surface font-semibold">{t('signUpLink')}</span>
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center px-6 pb-16 pt-8 md:items-center md:pt-0">
        <div className="flex w-full max-w-sm flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="text-balance text-3xl font-bold tracking-tight">
              {t('signInTitle')}
            </h1>
            <p className="text-surface/60 text-sm">{t('signInSubtitle')}</p>
          </div>

          <div className="flex flex-col gap-3">
            <GoogleSignInButton locale={locale} label={t('continueWithGoogle')} />
            <AppleSignInButton locale={locale} label={t('continueWithApple')} />
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-surface/10 h-px flex-1" />
            <span className="text-surface/40 text-xs">{t('orEmail')}</span>
            <span className="bg-surface/10 h-px flex-1" />
          </div>

          <SignInForm locale={locale} />
        </div>
      </div>
    </main>
  );
}
