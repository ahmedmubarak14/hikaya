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

/**
 * Reserved slugs at the root that must NOT route to /:username. The static
 * routes (sign-in, sign-up, me, discover, jobs, studios, blog) take precedence
 * automatically; this list is just an additional 404 guard for any future
 * top-level pages that haven't been created yet.
 */
const RESERVED = new Set([
  'sign-in', 'sign-up', 'me', 'discover', 'jobs', 'studios', 'blog',
  'about', 'pricing', 'terms', 'privacy', 'api', 'admin', 'help',
]);

export function generateStaticParams() {
  // Pre-generate the mock creator routes at build time. Real data swaps to a
  // dynamic fetch + revalidate strategy later.
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
        {/* Cover */}
        <section className="relative">
          <div className="relative h-[40vh] min-h-[320px] w-full overflow-hidden bg-surface/5">
            <Image
              src={creator.coverUrl}
              alt={`${name} — cover`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/10" />
          </div>
        </section>

        {/* Identity + CTAs */}
        <section className="mx-auto w-full max-w-8xl px-6 md:px-10">
          <div className="-mt-16 flex flex-col gap-8 md:-mt-20 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:gap-6">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-bg bg-surface/10 md:h-40 md:w-40">
                <Image
                  src={creator.avatarUrl}
                  alt={name}
                  fill
                  sizes="160px"
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

                <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">{name}</h1>

                <div className="flex flex-wrap items-center gap-2 text-2xs text-surface/50">
                  <span>{tCity(creator.city as 'RIYADH')}</span>
                  <Dot />
                  <span>{t('yearsExperience', { years: creator.yearsExperience })}</span>
                  <Dot />
                  <span>★ {creator.reviewScore.toFixed(1)} ({creator.reviewCount})</span>
                </div>
              </div>
            </div>

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

          {/* Bio */}
          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-[2fr_1fr]">
            <div>
              <p className="max-w-prose text-lg text-surface/80">{bio}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {creator.disciplines.map((d) => (
                  <DisciplineTag key={d} discipline={d} />
                ))}
              </div>
            </div>

            <aside className="flex flex-col gap-4 rounded-xl border border-surface/10 bg-surface/[0.03] p-6">
              {creator.startingPriceSar ? (
                <Stat
                  label={t('startingFrom')}
                  value={t('priceSar', {
                    price: creator.startingPriceSar.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-SA'),
                  })}
                />
              ) : null}
              <Stat label={t('languages')} value={creator.languages.join(' · ').toUpperCase()} />
              {creator.socialLinks.instagram ? (
                <SocialLink href={creator.socialLinks.instagram} label="Instagram" />
              ) : null}
              {creator.socialLinks.website ? (
                <SocialLink href={creator.socialLinks.website} label={t('website')} />
              ) : null}
            </aside>
          </div>
        </section>

        {/* Portfolio */}
        <section className="mx-auto w-full max-w-8xl px-6 py-22 md:px-10">
          <div className="mb-10 flex items-baseline justify-between">
            <h2 className="text-3xl md:text-4xl">{t('selectedWork')}</h2>
            <span className="text-2xs text-surface/40">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-2xs text-surface/40">
        {label}
      </span>
      <span className="text-base text-surface">{value}</span>
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
        'flex items-center justify-between gap-2 rounded-md border border-surface/10 px-3 py-2',
        'text-sm text-surface/80 transition-colors hover:border-surface/30 hover:text-surface',
      )}
    >
      <span>{label}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}
