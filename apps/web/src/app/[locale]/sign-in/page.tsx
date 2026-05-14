import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Logo } from '@hikaya/ui';

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
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel locale={locale} />

      <div className="flex flex-col items-center justify-center px-6 py-12 md:px-10">
        <div className="flex w-full max-w-md flex-col gap-8">
          <header className="flex flex-col gap-2">
            <span className="text-xs text-accent-secondary">
              {t('signInEyebrow')}
            </span>
            <h1 className="text-balance text-4xl">{t('signInTitle')}</h1>
            <p className="text-sm text-surface/60">{t('signInSubtitle')}</p>
          </header>

          <SignInForm locale={locale} />

          <DemoHint locale={locale} />
        </div>
      </div>
    </main>
  );
}

async function BrandPanel({ locale }: { locale: Locale }) {
  const t = await getTranslations('auth');
  return (
    <aside className="relative hidden overflow-hidden border-e border-surface/5 bg-bg lg:block">
      <div className="grain-overlay relative flex h-full flex-col justify-between p-10">
        <Logo arabic={locale === 'ar'} className="h-7 text-surface" />
        <div className="flex flex-col gap-6">
          <h2 className="max-w-md text-balance text-4xl">
            <span className="font-bold text-accent-secondary">{t('panelLineItalic')}</span>{' '}
            <span>{t('panelLine')}</span>
          </h2>
          <p className="max-w-sm text-sm text-surface/60">{t('panelBody')}</p>
        </div>
        <p className="text-xs text-surface/30">
          {t('panelFooter')}
        </p>
      </div>
    </aside>
  );
}

async function DemoHint({ locale }: { locale: Locale }) {
  const t = await getTranslations('auth');
  return (
    <div className="rounded-md border border-surface/10 bg-surface/[0.03] p-4">
      <p className="text-2xs text-surface/40">
        {t('demoLabel')}
      </p>
      <p className="mt-2 text-sm text-surface/70">
        {t.rich('demoCredentials', {
          email: (chunks) => <span className="font-mono text-surface">{chunks}</span>,
          password: (chunks) => <span className="font-mono text-surface">{chunks}</span>,
        })}
      </p>
      <p className="mt-1 text-xs text-surface/40">{t('demoNote', { locale })}</p>
    </div>
  );
}
