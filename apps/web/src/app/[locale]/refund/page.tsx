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
  return { title: t('refund.title') };
}

export default async function RefundPage({ params }: Props) {
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

          <h1>{t('refund.title')}</h1>
          <p className="text-surface/50 text-sm">{t('refund.lastUpdated')}</p>

          <h2>{t('refund.section1Title')}</h2>
          <p>{t('refund.section1Body')}</p>

          <h2>{t('refund.section2Title')}</h2>
          <p>{t('refund.section2Body')}</p>

          <h2>{t('refund.section3Title')}</h2>
          <p>{t('refund.section3Body')}</p>

          <h2>{t('refund.section4Title')}</h2>
          <p>{t('refund.section4Body')}</p>

          <h2>{t('refund.section5Title')}</h2>
          <p>{t('refund.section5Body')}</p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
