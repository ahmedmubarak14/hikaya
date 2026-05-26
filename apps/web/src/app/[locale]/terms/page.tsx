import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { type Locale } from '@/i18n/config';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('terms.title') };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('legal');

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-3xl px-6 md:px-10">
        <article className="prose prose-invert max-w-none">
          <p className="border-accent-secondary/30 bg-accent-secondary/5 text-accent-secondary mb-8 rounded-lg border p-4 text-sm">
            {t('draftNotice')}
          </p>

          <h1>{t('terms.title')}</h1>
          <p className="text-surface/50 text-sm">{t('terms.lastUpdated')}</p>

          <h2>{t('terms.section1Title')}</h2>
          <p>{t('terms.section1Body')}</p>

          <h2>{t('terms.section2Title')}</h2>
          <p>{t('terms.section2Body')}</p>

          <h2>{t('terms.section3Title')}</h2>
          <p>{t('terms.section3Body')}</p>

          <h2>{t('terms.section4Title')}</h2>
          <p>{t('terms.section4Body')}</p>

          <h2>{t('terms.section5Title')}</h2>
          <p>{t('terms.section5Body')}</p>

          <h2>{t('terms.section6Title')}</h2>
          <p>{t('terms.section6Body')}</p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
