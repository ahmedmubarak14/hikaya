import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button, cn } from '@hikaya/ui';

import { DisciplineTag } from '@/components/creators/discipline-tag';
import { PortfolioGrid } from '@/components/creators/portfolio-grid';
import { StartThreadButton } from '@/components/messages/start-thread-button';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { CREATORS } from '@/lib/creators/mock-data';
import { getCreatorByUsername } from '@/lib/creators/queries';
import { listActiveProductsByCreator } from '@/lib/store/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; username: string }>;
}

const RESERVED = new Set([
  'sign-in', 'sign-up', 'me', 'discover', 'jobs', 'studios', 'blog',
  'about', 'pricing', 'terms', 'privacy', 'api', 'admin', 'help',
]);

export function generateStaticParams() {
  return CREATORS.map((c) => ({ username: c.username }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  if (RESERVED.has(username.toLowerCase())) return {};
  const creator = await getCreatorByUsername(username);
  if (!creator) return {};
  const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;
  return {
    title: name,
    description: locale === 'ar' ? creator.bioAr : creator.bioEn,
  };
}

const AVAILABILITY_TONE = {
  AVAILABLE: 'sage',
  BUSY: 'warning',
  ON_VACATION: 'neutral',
} as const;

export default async function CreatorProfilePage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  if (RESERVED.has(username.toLowerCase())) notFound();

  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  const t = await getTranslations('creator');
  const tCity = await getTranslations('cities');

  const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;
  const bio = locale === 'ar' ? creator.bioAr : creator.bioEn;
  const hasStore = listActiveProductsByCreator(creator.id).length > 0;

  return (
    <>
      <SiteHeader />
      <main>
        {/* Identity — AdPlist/Contra-style tight header: avatar + name + meta
            chips + CTAs on one row. No full-bleed cover image. */}
        <section className="mx-auto w-full max-w-8xl px-6 pt-10 md:px-10 md:pt-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface/10 ring-1 ring-surface/10 md:h-28 md:w-28">
                <Image
                  src={creator.avatarUrl}
                  alt={name}
                  fill
                  priority
                  sizes="120px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {creator.isVerified ? (
                    <Badge tone="accent">{t('verified')}</Badge>
                  ) : null}
                  <Badge tone={AVAILABILITY_TONE[creator.availability]}>
                    {t(
                      creator.availability === 'AVAILABLE'
                        ? 'available'
                        : creator.availability === 'BUSY'
                          ? 'busy'
                          : 'onVacation',
                    )}
                  </Badge>
                </div>

                <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                  {name}
                </h1>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-surface/60">
                  <span>{tCity(creator.city as 'RIYADH')}</span>
                  <Dot />
                  <span>{t('yearsExperience', { years: creator.yearsExperience })}</span>
                  <Dot />
                  <span>
                    <span className="text-accent-secondary">★</span>{' '}
                    {creator.reviewScore.toFixed(1)}
                    <span className="ms-1 text-surface/40">({creator.reviewCount})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/${locale}/${creator.username}/hire`}>
                <Button size="md" variant="primary">{t('hireCta')}</Button>
              </Link>
              <StartThreadButton locale={locale} creatorUsername={creator.username} />
              {hasStore ? (
                <Link
                  href={`/${locale}/${creator.username}/store`}
                  className="rounded-full border border-surface/15 px-5 py-2.5 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
                >
                  {t('viewStore')} →
                </Link>
              ) : null}
            </div>
          </div>

          {/* Bio + disciplines + facts row */}
          <div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-4">
              <p className="max-w-prose text-base text-surface/80">{bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {creator.disciplines.map((d) => (
                  <DisciplineTag key={d} discipline={d} />
                ))}
              </div>
            </div>

            <aside className="flex flex-col gap-3 text-sm">
              {creator.startingPriceSar ? (
                <Fact
                  label={t('startingFrom')}
                  value={t('priceSar', {
                    price: creator.startingPriceSar.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-SA'),
                  })}
                />
              ) : null}
              <Fact label={t('languages')} value={creator.languages.join(' · ').toUpperCase()} />
              <div className="flex flex-wrap gap-2 pt-1">
                {creator.socialLinks.instagram ? (
                  <SocialLink href={creator.socialLinks.instagram} label="Instagram" />
                ) : null}
                {creator.socialLinks.website ? (
                  <SocialLink href={creator.socialLinks.website} label={t('website')} />
                ) : null}
              </div>
            </aside>
          </div>
        </section>

        {/* Portfolio — the work is the centerpiece. Pixieset/ModelManagement
            give portrait grids most of the page. */}
        <section className="mx-auto w-full max-w-8xl px-6 pb-22 pt-12 md:px-10 md:pt-16">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">
              {t('selectedWork')}
            </h2>
            <span className="text-sm text-surface/50">
              {creator.portfolio.length} {t('pieces')}
            </span>
          </div>

          <PortfolioGrid items={creator.portfolio} layout={creator.preferredLayout} altPrefix={name} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Dot() {
  return <span aria-hidden className="inline-block h-1 w-1 rounded-full bg-surface/30" />;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-surface/10 pb-2 last:border-0 last:pb-0">
      <span className="text-surface/50">{label}</span>
      <span className="text-end font-medium text-surface">{value}</span>
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-surface/15 px-3 py-1 text-xs text-surface/80',
        'transition-colors hover:border-surface/40 hover:text-surface',
      )}
    >
      <span>{label}</span>
      <span aria-hidden>↗</span>
    </Link>
  );
}
