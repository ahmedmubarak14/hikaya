import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { QuoteBuilder } from '@/components/quotes/quote-builder';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'quotes.builder' });
  return { title: t('title') };
}

export default async function NewQuotePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/quotes/new`);

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) redirect(`/${locale}/me/portfolio`);

  const t = await getTranslations('quotes.builder');

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/quotes`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('back')}
          </Link>
          <h1 className="text-balance text-4xl">{t('title')}</h1>
          <p className="text-surface/60">{t('subtitle')}</p>
        </header>

        <QuoteBuilder locale={locale} />
      </div>
  );
}
