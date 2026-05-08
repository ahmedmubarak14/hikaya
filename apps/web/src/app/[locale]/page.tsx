import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';

import { Badge, Button, Card, CardBody } from '@hikaya/ui';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Home />;
}

function Home() {
  const t = useTranslations('home');
  const tBrand = useTranslations('brand');

  const valueProps = [
    { key: 'portfolioTitle', body: 'portfolioBody', tone: 'accent' as const },
    { key: 'hireTitle',      body: 'hireBody',      tone: 'sage' as const },
    { key: 'studioTitle',    body: 'studioBody',    tone: 'info' as const },
    { key: 'deliverTitle',   body: 'deliverBody',   tone: 'purple' as const },
  ];

  const phaseKeys = [
    'design', 'auth', 'profile', 'browse',
    'hiring', 'messaging', 'galleries', 'studio',
    'contracts', 'store', 'dashboard', 'payments',
  ] as const;

  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="grain-overlay relative">
            <div className="mx-auto flex w-full max-w-8xl flex-col gap-12 px-6 py-22 md:px-10 md:py-30">
              <Badge tone="accent" className="self-start">
                {t('eyebrow')}
              </Badge>

              <h1 className="max-w-5xl text-balance text-5xl leading-[1.02] md:text-7xl">
                <span className="text-surface">{t('headline.lineOne')}</span>{' '}
                <em className="font-display italic text-accent">
                  {t('headline.lineTwoItalic')}
                </em>{' '}
                <span className="text-surface">{t('headline.lineThree')}</span>
              </h1>

              <p className="max-w-2xl text-balance text-lg text-surface/70 md:text-xl">
                {t('subheadline')}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" variant="primary">
                  {t('ctaPrimary')}
                </Button>
                <Button size="lg" variant="outline">
                  {t('ctaSecondary')}
                </Button>
              </div>

              <p className="mt-8 max-w-md font-mono text-xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('trustedBy')}
              </p>
            </div>
          </div>
        </section>

        {/* VALUE PROPS */}
        <section className="mx-auto w-full max-w-8xl px-6 pb-22 md:px-10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {valueProps.map((vp) => (
              <Card key={vp.key} interactive className="overflow-hidden">
                <CardBody className="flex h-full flex-col gap-4 p-8">
                  <Badge tone={vp.tone} className="self-start">
                    {tBrand('name')}
                  </Badge>
                  <h3 className="text-2xl text-surface">
                    {t(`valueProps.${vp.key}` as 'valueProps.portfolioTitle')}
                  </h3>
                  <p className="text-base text-surface/60">
                    {t(`valueProps.${vp.body}` as 'valueProps.portfolioBody')}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        {/* PHASE 1 ROADMAP */}
        <section className="border-t border-surface/5">
          <div className="mx-auto w-full max-w-8xl px-6 py-22 md:px-10">
            <div className="mb-10 flex flex-col gap-3">
              <span className="font-mono text-xs uppercase tracking-widest text-accent [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('phaseLabel')}
              </span>
              <h2 className="max-w-3xl text-balance text-3xl md:text-5xl">
                {t('phaseTitle')}
              </h2>
            </div>

            <ol className="grid grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {phaseKeys.map((key, idx) => (
                <li
                  key={key}
                  className="flex items-baseline gap-4 border-b border-surface/5 py-4"
                >
                  <span className="font-mono text-xs text-surface/40 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-base text-surface/80">
                    {t(`phaseItems.${key}` as 'phaseItems.design')}
                  </span>
                </li>
              ))}
            </ol>

            <p className="mt-12 max-w-prose font-mono text-xs uppercase tracking-widest text-surface/30 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
              {t('footerNote')}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
