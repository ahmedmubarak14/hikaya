import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Logo } from '@hikaya/ui';

import { SignUpForm } from '@/components/auth/sign-up-form';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('signUpTitle') };
}

export default async function SignUpPage({ params }: Props) {
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
        <Link href={`/${locale}/sign-in`} className="text-surface/70 hover:text-surface text-sm">
          {t('haveAccount')} <span className="text-surface font-semibold">{t('signInLink')}</span>
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center px-6 pb-16 pt-8 md:pt-2">
        <div className="flex w-full max-w-sm flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="text-balance text-3xl font-bold tracking-tight">{t('signUpTitle')}</h1>
            <p className="text-surface/60 text-sm">{t('signUpSubtitle')}</p>
          </div>

          <SignUpForm locale={locale} />
        </div>
      </div>
    </main>
  );
}
