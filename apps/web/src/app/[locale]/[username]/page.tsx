import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button, cn } from '@hikaya/ui';

import { DisciplineTag } from '@/components/creators/discipline-tag';
import { PortfolioGrid } from '@/components/creators/portfolio-grid';
import { ProfileTabs, type ProfileTab } from '@/components/creators/profile-tabs';
import { StartThreadButton } from '@/components/messages/start-thread-button';
import { ProductCard } from '@/components/store/product-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getPublishedPostsByCreator } from '@/lib/blog/mock-store';
import { CREATORS } from '@/lib/creators/mock-data';
import { getCreatorByUsername } from '@/lib/creators/queries';
import { listActiveProductsByCreator } from '@/lib/store/mock-store';
import { IS_STATIC_EXPORT } from '@/lib/static-export';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const RESERVED = new Set([
  'sign-in',
  'sign-up',
  'me',
  'discover',
  'jobs',
  'studios',
  'blog',
  'about',
  'pricing',
  'terms',
  'privacy',
  'api',
  'admin',
  'help',
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

export default async function CreatorProfilePage({ params, searchParams }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  if (RESERVED.has(username.toLowerCase())) notFound();

  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  // Static export drops searchParams. Default tab is "work" either way.
  const sp = IS_STATIC_EXPORT ? {} : await searchParams;
  const rawTab = sp.tab;
  const tab: ProfileTab = rawTab === 'store' ? 'store' : rawTab === 'about' ? 'about' : 'work';

  const t = await getTranslations('creator');
  const tCity = await getTranslations('cities');
  const tBlog = await getTranslations('blog.profile');

  const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;
  const bio = locale === 'ar' ? creator.bioAr : creator.bioEn;
  const products = listActiveProductsByCreator(creator.id);
  const hasStore = products.length > 0;
  const publishedPostCount = getPublishedPostsByCreator(creator.id).length;

  // Force tab back to "work" if user asks for store but there's no store.
  const effectiveTab: ProfileTab = tab === 'store' && !hasStore ? 'work' : tab;

  return (
    <>
      <SiteHeader />
      <main className="max-w-8xl pb-22 mx-auto w-full px-6 pt-10 md:px-10 md:pt-12">
        {/* Identity row — Instagram-style horizontal: avatar + stacked name/stats/bio,
            CTAs pinned to the trailing edge on md+. */}
        <section className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="bg-surface/10 ring-surface/10 relative h-32 w-32 shrink-0 overflow-hidden rounded-full ring-1 md:h-36 md:w-36">
              <Image
                src={creator.avatarUrl}
                alt={name}
                fill
                priority
                sizes="144px"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col gap-3">
              {/* Availability + verified — above name */}
              <div className="flex flex-wrap items-center gap-2">
                {creator.isVerified ? <Badge tone="accent">{t('verified')}</Badge> : null}
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

              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{name}</h1>

              {/* Stats pills row */}
              <ul className="text-surface/70 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Stat>{t('stats.projects', { count: creator.portfolio.length })}</Stat>
                <Dot />
                <Stat>
                  <span className="text-accent-secondary">★</span>{' '}
                  {t('stats.rating', {
                    score: creator.reviewScore.toFixed(1),
                    count: creator.reviewCount,
                  })}
                </Stat>
                <Dot />
                <Stat>{t('stats.years', { years: creator.yearsExperience })}</Stat>
                <Dot />
                <Stat>{tCity(creator.city as 'RIYADH')}</Stat>
              </ul>

              <p className="text-surface/80 max-w-prose text-base">{bio}</p>
              {publishedPostCount > 0 ? (
                <Link
                  href={`/${locale}/${creator.username}/blog`}
                  className="text-accent-secondary self-start text-sm underline-offset-4 hover:underline"
                >
                  {tBlog('linkToBlog', { count: publishedPostCount })}
                </Link>
              ) : null}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {creator.disciplines.map((d) => (
                  <DisciplineTag key={d} discipline={d} />
                ))}
              </div>
            </div>
          </div>

          {/* CTAs — pinned right on md+, stacked under on mobile */}
          <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-stretch">
            <Link href={`/${locale}/${creator.username}/hire`}>
              <Button size="md" variant="primary" className="w-full">
                {t('hireCta')}
              </Button>
            </Link>
            <StartThreadButton locale={locale} creatorUsername={creator.username} />
            {hasStore ? (
              <Link
                href={`/${locale}/${creator.username}?tab=store`}
                className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm transition-colors"
              >
                {t('viewStore')}
              </Link>
            ) : null}
          </div>
        </section>

        {/* Tabs */}
        <div className="mt-10">
          <Suspense>
            <ProfileTabs
              active={effectiveTab}
              labels={{
                work: t('tabs.work'),
                store: t('tabs.store'),
                about: t('tabs.about'),
              }}
              storeEnabled={hasStore}
            />
          </Suspense>
        </div>

        {/* Tab content */}
        <div className="mt-8">
          {effectiveTab === 'work' ? (
            <PortfolioGrid
              items={creator.portfolio}
              layout={creator.preferredLayout}
              altPrefix={name}
            />
          ) : effectiveTab === 'store' ? (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <li key={p.id}>
                  <ProductCard
                    product={p}
                    href={`/${locale}/${creator.username}/store/${p.slug}`}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <AboutTab
              bio={bio}
              languages={creator.languages.join(' · ').toUpperCase()}
              languagesLabel={t('languages')}
              linksLabel={t('about.links')}
              instagram={creator.socialLinks.instagram}
              website={creator.socialLinks.website}
              websiteLabel={t('website')}
              priceLabel={creator.startingPriceSar ? t('startingFrom') : null}
              priceValue={
                creator.startingPriceSar
                  ? t('priceSar', {
                      price: creator.startingPriceSar.toLocaleString(
                        locale === 'ar' ? 'ar-SA' : 'en-SA',
                      ),
                    })
                  : null
              }
            />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ children }: { children: React.ReactNode }) {
  return <li className="inline-flex items-center">{children}</li>;
}

function Dot() {
  return (
    <li aria-hidden className="inline-block">
      <span className="bg-surface/30 inline-block h-1 w-1 rounded-full" />
    </li>
  );
}

interface AboutProps {
  bio: string;
  languages: string;
  languagesLabel: string;
  linksLabel: string;
  instagram?: string;
  website?: string;
  websiteLabel: string;
  priceLabel: string | null;
  priceValue: string | null;
}

function AboutTab({
  bio,
  languages,
  languagesLabel,
  linksLabel,
  instagram,
  website,
  websiteLabel,
  priceLabel,
  priceValue,
}: AboutProps) {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-4">
        <p className="text-surface/80 text-base leading-relaxed">{bio}</p>
      </div>

      <aside className="flex flex-col gap-3 text-sm">
        {priceLabel && priceValue ? <Fact label={priceLabel} value={priceValue} /> : null}
        <Fact label={languagesLabel} value={languages} />
        {instagram || website ? (
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-surface/50">{linksLabel}</span>
            <div className="flex flex-wrap gap-2">
              {instagram ? <SocialLink href={instagram} label="Instagram" /> : null}
              {website ? <SocialLink href={website} label={websiteLabel} /> : null}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-surface/10 flex items-baseline justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-surface/50">{label}</span>
      <span className="text-surface text-end font-medium">{value}</span>
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
        'border-surface/15 text-surface/80 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs',
        'hover:border-surface/40 hover:text-surface transition-colors',
      )}
    >
      <span>{label}</span>
      <span aria-hidden>↗</span>
    </Link>
  );
}
