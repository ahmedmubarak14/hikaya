import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Button, Logo } from '@hikaya/ui';

import { AppleSignInButton } from '@/components/auth/apple-sign-in-button';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { SignInForm } from '@/components/auth/sign-in-form';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { IS_STATIC_EXPORT } from '@/lib/static-export';

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
  // Live build: signed-in users get bounced to their dashboard. The static
  // export also has a session (for GitHub Pages preview), but server-side
  // redirect() during prerender turns into a meta-refresh hop — so we skip
  // it there. IS_STATIC_EXPORT check keeps the form rendered on the preview.
  if (session && !IS_STATIC_EXPORT) redirect(`/${locale}/me`);

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
          {session ? (
            <DemoSignedInPanel locale={locale} displayName={session.user.displayName} />
          ) : (
            <>
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

              <DemoHint locale={locale} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

async function DemoSignedInPanel({ locale, displayName }: { locale: Locale; displayName: string }) {
  const t = await getTranslations('auth');
  return (
    <div className="flex flex-col gap-5">
      <div className="border-accent/40 bg-accent/10 rounded-lg border p-5">
        <p className="text-2xs text-surface/60 font-semibold uppercase tracking-wider">
          {t('demoSignedInLabel')}
        </p>
        <p className="text-surface mt-2 text-base">
          {t('demoSignedInBody', { name: displayName })}
        </p>
        <p className="text-surface/60 mt-1 text-xs">{t('demoSignedInHint')}</p>
      </div>

      <Link href={`/${locale}/me`} className="self-start">
        <Button size="lg" variant="primary">
          {t('demoSignedInGoToDashboard')}
        </Button>
      </Link>
    </div>
  );
}

async function DemoHint({ locale }: { locale: Locale }) {
  const t = await getTranslations('auth');
  return (
    <div className="border-surface/10 bg-surface/[0.03] rounded-lg border p-4">
      <p className="text-2xs text-surface/60 font-semibold">{t('demoLabel')}</p>
      <p className="text-surface/70 mt-1.5 text-sm">
        {t.rich('demoCredentials', {
          email: (chunks) => <span className="text-surface font-mono">{chunks}</span>,
          password: (chunks) => <span className="text-surface font-mono">{chunks}</span>,
        })}
      </p>
      <p className="text-surface/40 mt-1 text-xs">{t('demoNote', { locale })}</p>
    </div>
  );
}
