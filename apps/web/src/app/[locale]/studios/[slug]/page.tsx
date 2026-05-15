import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { DisciplineTag } from '@/components/creators/discipline-tag';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale, locales } from '@/i18n/config';
import { getCreatorByOwnerEmail } from '@/lib/creators/mock-store';
import { findUserById } from '@/lib/auth/mock-store';
import { getAllStudios, getStudioBySlug } from '@/lib/studio/profile';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; slug: string }>;
}

export function generateStaticParams() {
  // Cartesian product of locales × seeded studios so `output: 'export'` can
  // pre-render every public profile under both /en and /ar.
  const studios = getAllStudios();
  const out: { locale: Locale; slug: string }[] = [];
  for (const locale of locales) {
    for (const s of studios) out.push({ locale, slug: s.slug });
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const studio = getStudioBySlug(slug);
  if (!studio) return {};
  const name = locale === 'ar' && studio.nameAr ? studio.nameAr : studio.nameEn;
  const description =
    locale === 'ar' && studio.descriptionAr ? studio.descriptionAr : studio.descriptionEn;
  return { title: name, description };
}

export default async function StudioPublicProfilePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const studio = getStudioBySlug(slug);
  if (!studio) notFound();

  const t = await getTranslations('studios');
  const tCity = await getTranslations('cities');

  const name = locale === 'ar' && studio.nameAr ? studio.nameAr : studio.nameEn;
  const description =
    locale === 'ar' && studio.descriptionAr ? studio.descriptionAr : studio.descriptionEn;

  // Resolve team members: each id → MockUser → CreatorProfile (by ownerEmail).
  const team = studio.teamMemberIds
    .map((uid) => {
      const user = findUserById(uid);
      if (!user) return null;
      const creator = getCreatorByOwnerEmail(user.email);
      if (!creator) return null;
      return {
        userId: uid,
        username: creator.username,
        displayName: locale === 'ar' ? creator.displayNameAr : creator.displayNameEn,
        avatarUrl: creator.avatarUrl,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <>
      <SiteHeader />
      <main>
        {/* Cover */}
        <section className="relative h-48 w-full bg-surface/5 md:h-72">
          {studio.coverUrl ? (
            <Image
              src={studio.coverUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
        </section>

        {/* Identity row */}
        <section className="mx-auto w-full max-w-8xl px-6 md:px-10">
          <div className="-mt-12 flex flex-col gap-6 md:-mt-16 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:gap-6">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-bg bg-surface/10 shadow-lg md:h-32 md:w-32">
                {studio.logoUrl ? (
                  <Image
                    src={studio.logoUrl}
                    alt={name}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl text-surface/40">
                    {name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pb-1">
                <Badge tone="neutral" className="self-start">{t('public.eyebrow')}</Badge>
                <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                  {name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-surface/60">
                  <span>{tCity(studio.city as 'RIYADH')}</span>
                  {studio.address ? (
                    <>
                      <Dot />
                      <span>{studio.address}</span>
                    </>
                  ) : null}
                  <Dot />
                  <span>{t('public.capacity', { count: studio.capacity })}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`mailto:${studio.contactEmail ?? ''}`}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
              >
                {t('public.inquire')}
              </Link>
            </div>
          </div>

          {/* Body */}
          <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-6 pb-10 md:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="mb-2 text-sm font-medium text-surface/50">
                  {t('public.aboutLabel')}
                </h2>
                <p className="max-w-prose whitespace-pre-line text-base text-surface/80">
                  {description}
                </p>
              </div>

              <div>
                <h2 className="mb-2 text-sm font-medium text-surface/50">
                  {t('public.specializationsLabel')}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {studio.specializations.map((d) => (
                    <DisciplineTag key={d} discipline={d} />
                  ))}
                </div>
              </div>

              {team.length > 0 ? (
                <div>
                  <h2 className="mb-3 text-sm font-medium text-surface/50">
                    {t('public.teamLabel')}
                  </h2>
                  <ul className="flex flex-wrap gap-4">
                    {team.map((m) => (
                      <li key={m.userId}>
                        <Link
                          href={`/${locale}/${m.username}`}
                          className="group flex items-center gap-2"
                        >
                          <span className="relative block h-10 w-10 overflow-hidden rounded-full bg-surface/10">
                            <Image
                              src={m.avatarUrl}
                              alt={m.displayName}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </span>
                          <span className="text-sm text-surface/80 group-hover:text-surface group-hover:underline underline-offset-2">
                            {m.displayName}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <aside className="flex flex-col gap-3 text-sm">
              {studio.contactEmail ? (
                <Fact label={t('public.contactEmail')} value={studio.contactEmail} />
              ) : null}
              {studio.contactPhone ? (
                <Fact label={t('public.contactPhone')} value={studio.contactPhone} />
              ) : null}
            </aside>
          </div>
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
