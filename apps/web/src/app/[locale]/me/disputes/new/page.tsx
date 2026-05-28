import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FileDisputeForm } from '@/components/disputes/file-dispute-form';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'disputes' });
  return { title: t('newTitle') };
}

export default async function NewDisputePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const t = await getTranslations('disputes');

  return (
    <>
      <main className="py-22 mx-auto w-full max-w-2xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/disputes`}
            className="text-surface/50 hover:text-surface/70 text-sm transition-colors"
          >
            {t('backToDisputes')}
          </Link>
          <h1 className="text-balance text-4xl">{t('newTitle')}</h1>
          <p className="text-surface/60 max-w-prose">{t('newSubtitle')}</p>
        </header>

        <FileDisputeForm locale={locale} />
      </main>
    </>
  );
}
