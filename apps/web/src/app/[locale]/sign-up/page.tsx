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
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden border-e border-surface/5 bg-bg lg:block">
        <div className="grain-overlay relative flex h-full flex-col justify-between p-10">
          <Logo arabic={locale === 'ar'} className="h-7 text-surface" />
          <div className="flex flex-col gap-6">
            <h2 className="max-w-md text-balance text-4xl">
              <em className="font-display italic text-accent">{t('panelLineItalic')}</em>{' '}
              <span>{t('panelLine')}</span>
            </h2>
            <p className="max-w-sm text-sm text-surface/60">{t('panelBody')}</p>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-surface/30 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
            {t('panelFooter')}
          </p>
        </div>
      </aside>

      <div className="flex flex-col items-center justify-center px-6 py-12 md:px-10">
        <div className="flex w-full max-w-md flex-col gap-8">
          <header className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-accent [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
              {t('signUpEyebrow')}
            </span>
            <h1 className="text-balance text-4xl">{t('signUpTitle')}</h1>
            <p className="text-sm text-surface/60">{t('signUpSubtitle')}</p>
          </header>

          <SignUpForm locale={locale} />
        </div>
      </div>
    </main>
  );
}
