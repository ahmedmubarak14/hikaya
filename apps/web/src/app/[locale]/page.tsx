import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

import { Button } from '@hikaya/ui';

import { CreatorCard } from '@/components/creators/creator-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { listFeaturedCreators } from '@/lib/creators/queries';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const featured = (await listFeaturedCreators(6)).slice(0, 6);

  const valueProps = [
    { key: 'portfolioTitle', body: 'portfolioBody' },
    { key: 'hireTitle',      body: 'hireBody' },
    { key: 'studioTitle',    body: 'studioBody' },
    { key: 'deliverTitle',   body: 'deliverBody' },
  ] as const;

  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO — tighter, sans-led, no grain. Italic Playfair survives on a
            single accent word so the brand keeps a signature without bleeding
            editorial chrome into every page. */}
        <section className="mx-auto w-full max-w-8xl px-6 pt-16 pb-12 md:px-10 md:pt-22 md:pb-16">
          <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight md:text-6xl">
            {t('headline.lineOne')}{' '}
            <em className="font-display italic font-normal text-accent-secondary">
              {t('headline.lineTwoItalic')}
            </em>{' '}
            {t('headline.lineThree')}
          </h1>

          <p className="mt-6 max-w-2xl text-balance text-lg text-surface/70 md:text-xl">
            {t('subheadline')}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/${locale}/sign-up`}>
              <Button size="lg" variant="primary">{t('ctaPrimary')}</Button>
            </Link>
            <Link href={`/${locale}/discover`}>
              <Button size="lg" variant="outline">{t('ctaSecondary')}</Button>
            </Link>
          </div>
        </section>

        {/* FEATURED — photo-first grid. The work introduces the platform, not
            the copy. Mirrors Contra/AdPlist's "explore" feel. */}
        <section className="mx-auto w-full max-w-8xl px-6 pb-22 md:px-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t('featured.title')}
            </h2>
            <Link
              href={`/${locale}/discover`}
              className="shrink-0 text-sm text-surface/70 underline-offset-4 hover:text-surface hover:underline"
            >
              {t('featured.viewAll')}
            </Link>
          </div>

          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((creator) => (
              <li key={creator.id}>
                <CreatorCard creator={creator} />
              </li>
            ))}
          </ul>
        </section>

        {/* WHAT YOU GET — a clean four-up. No card chrome; just hairlines and
            generous spacing. */}
        <section className="border-t border-surface/10">
          <div className="mx-auto w-full max-w-8xl px-6 py-16 md:px-10 md:py-22">
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight md:text-4xl">
              {t('valuePropsTitle')}
            </h2>

            <dl className="mt-10 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {valueProps.map((vp, idx) => (
                <div key={vp.key} className="flex flex-col gap-3">
                  <span className="font-mono text-2xs text-surface/40 tabular-nums [lang=ar]:font-sansAr">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <dt className="text-lg font-semibold">
                    {t(`valueProps.${vp.key}` as 'valueProps.portfolioTitle')}
                  </dt>
                  <dd className="text-sm text-surface/60">
                    {t(`valueProps.${vp.body}` as 'valueProps.portfolioBody')}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA STRIP — single, direct. */}
        <section className="border-t border-surface/10">
          <div className="mx-auto flex w-full max-w-8xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10 md:py-20">
            <div>
              <h2 className="max-w-xl text-2xl font-bold tracking-tight md:text-3xl">
                {t('ctaStrip.title')}
              </h2>
              <p className="mt-2 max-w-xl text-surface/60">{t('ctaStrip.body')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/${locale}/sign-up`}>
                <Button size="md" variant="primary">{t('ctaPrimary')}</Button>
              </Link>
              <Link href={`/${locale}/jobs`}>
                <Button size="md" variant="outline">{t('ctaStrip.browseJobs')}</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
