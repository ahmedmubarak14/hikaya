import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { AddImagesForm } from '@/components/galleries/add-images-form';
import { CopyLinkButton } from '@/components/galleries/copy-link-button';
import { DeleteGalleryButton } from '@/components/galleries/delete-gallery-button';
import { RemoveImageButton } from '@/components/galleries/remove-image-button';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import {
  countDistinctVisitors,
  countSelectionsPerImage,
  getGalleryById,
} from '@/lib/galleries/mock-store';

import type { Metadata } from 'next';

import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { DemoModeNotice } from '@/components/demo-mode-notice';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

// Auth-gated route — generate one placeholder per locale so Next has
// something to render; the page itself short-circuits to DemoModeNotice
// when EXPORT=1, so the placeholder id is never actually used.
export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  return locales.map((locale) => ({ locale, id: '_demo' }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const gallery = getGalleryById(id);
  if (!gallery) return {};
  const t = await getTranslations({ locale, namespace: 'gallery.manage' });
  return { title: `${t('title')} · ${gallery.titleEn}` };
}

export default async function ManageGalleryPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/galleries/${id}`);

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) redirect(`/${locale}/me/galleries`);

  const gallery = getGalleryById(id);
  if (!gallery || gallery.creatorId !== creator.id) notFound();

  const t = await getTranslations('gallery.manage');

  const title = locale === 'ar' && gallery.titleAr ? gallery.titleAr : gallery.titleEn;
  const selectionCounts = countSelectionsPerImage(gallery.id);
  const visitorCount = countDistinctVisitors(gallery.id);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const shareUrl = `${baseUrl}/${locale}/g/${gallery.shareSlug}`;

  // Most-favorited list for the right sidebar.
  const topFavorites = gallery.images
    .map((img) => ({ img, count: selectionCounts.get(img.id) ?? 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-6 py-22 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/galleries`}
            className="text-2xs text-surface/40 transition-colors hover:text-surface"
          >
            ← {t('back')}
          </Link>
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-5xl">{title}</h1>
          {gallery.message ? (
            <p className="max-w-prose text-surface/60">{gallery.message}</p>
          ) : null}
        </header>

        {/* Share + stats */}
        <section className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardBody className="flex flex-col gap-3 p-5">
              <span className="text-2xs text-accent-secondary">
                {t('shareLabel')}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <code className="flex-1 break-all rounded-md border border-surface/10 bg-surface/[0.03] px-3 py-2 font-mono text-sm text-surface">
                  {shareUrl}
                </code>
                <CopyLinkButton url={shareUrl} />
                <Link
                  href={`/${locale}/g/${gallery.shareSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-surface/15 px-4 py-2 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
                >
                  {t('preview')} ↗
                </Link>
              </div>
              <p className="text-xs text-surface/50">{t('shareHint')}</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col gap-2 p-5">
              <span className="text-2xs text-surface/40">
                {t('stats')}
              </span>
              <ul className="grid grid-cols-3 gap-2 text-center">
                <Stat label={t('imagesLabel')} value={String(gallery.images.length)} />
                <Stat label={t('visitorsLabel')} value={String(visitorCount)} />
                <Stat
                  label={t('favoritesLabel')}
                  value={String([...selectionCounts.values()].reduce((a, b) => a + b, 0))}
                />
              </ul>
              {gallery.expiresAt ? (
                <p className="mt-1 text-2xs text-surface/40">
                  {t('expires', {
                    date: new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }).format(new Date(gallery.expiresAt)),
                  })}
                </p>
              ) : null}
            </CardBody>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            <AddImagesForm locale={locale} galleryId={gallery.id} />

            {gallery.images.length === 0 ? (
              <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-10 text-center">
                <p className="text-lg text-surface/70">{t('noImages')}</p>
                <p className="mt-2 text-sm text-surface/40">{t('noImagesHint')}</p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {gallery.images.map((img) => {
                  const count = selectionCounts.get(img.id) ?? 0;
                  return (
                    <li key={img.id} className="group relative">
                      <figure className="relative aspect-[4/5] overflow-hidden rounded-md border border-surface/10 bg-surface/5">
                        <Image
                          src={img.url}
                          alt={img.titleEn ?? title}
                          fill
                          sizes="(min-width: 768px) 33vw, 50vw"
                          className="object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-bg/40 opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="pointer-events-auto absolute inset-x-2 top-2 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <Badge tone={count > 0 ? 'accent' : 'neutral'}>
                            ♥ {count}
                          </Badge>
                          <RemoveImageButton locale={locale} galleryId={gallery.id} imageId={img.id} />
                        </div>
                      </figure>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-5">
              <h3 className="mb-3 text-lg text-surface">{t('topFavorites')}</h3>
              {topFavorites.length === 0 ? (
                <p className="text-sm text-surface/50">{t('noFavoritesYet')}</p>
              ) : (
                <ul className="grid grid-cols-3 gap-2">
                  {topFavorites.map(({ img, count }) => (
                    <li key={img.id} className="relative">
                      <div className="relative aspect-square overflow-hidden rounded">
                        <Image
                          src={img.url}
                          alt=""
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      </div>
                      <span className="absolute -end-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 font-mono text-2xs text-ink">
                        ♥{count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 p-5">
              <h3 className="mb-2 text-lg text-surface">{t('dangerZone')}</h3>
              <p className="mb-4 text-xs text-surface/50">{t('dangerHint')}</p>
              <DeleteGalleryButton locale={locale} galleryId={gallery.id} />
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex flex-col gap-1 rounded-md bg-surface/[0.03] py-3">
      <span className="font-display text-2xl text-surface">{value}</span>
      <span className="text-2xs text-surface/40">
        {label}
      </span>
    </li>
  );
}
