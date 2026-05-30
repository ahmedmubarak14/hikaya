import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MailCheck } from 'lucide-react';

import { type Locale } from '@/i18n/config';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ email?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.checkEmail' });
  return { title: t('title') };
}

export default async function CheckEmailPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { email } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('auth.checkEmail');

  return (
    <div className="mx-auto w-full max-w-md px-6 py-20 text-center">
      <div className="bg-accent/15 text-accent mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
        <MailCheck size={28} />
      </div>
      <h1 className="text-surface text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="text-muted mt-3 text-sm leading-relaxed">
        {email ? t('bodyWithEmail', { email }) : t('body')}
      </p>
      <p className="text-muted mt-2 text-xs">{t('spamHint')}</p>
      <div className="mt-8">
        <Link
          href={`/${locale}/sign-in`}
          className="bg-surface text-bg hover:bg-surface/90 inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
        >
          {t('backToSignIn')}
        </Link>
      </div>
    </div>
  );
}
