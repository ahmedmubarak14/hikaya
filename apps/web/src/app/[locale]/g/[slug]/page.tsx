import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Logo, cn } from '@hikaya/ui';

import { GalleryGridClient } from '@/components/galleries/gallery-grid-client';
import { HeartButton } from '@/components/galleries/heart-button';
import { type Locale } from '@/i18n/config';
import { getCreatorById } from '@/lib/creators/mock-store';
import { readVisitorId } from '@/lib/galleries/actions';
import { getGalleryBySlug, getVisitorSelections } from '@/lib/galleries/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateStaticParams() {
  const { SEED_GALLERIES } = await import('@/lib/galleries/mock-data');
  const { locales } = await import('@/i18n/config');
  return locales.flatMap((locale) => SEED_GALLERIES.map((g) => ({ locale, slug: g.shareSlug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gallery = getGalleryBySlug(slug);
  if (!gallery) return {};
  return {
    title: gallery.titleEn,
    description: gallery.message,
    robots: { index: false, follow: false },
  };
}

export default async function PublicGalleryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const gallery = getGalleryBySlug(slug);
  if (!gallery) notFound();

  const creator = getCreatorById(gallery.creatorId);
  const t = await getTranslations('gallery.viewer');

  const title = locale === 'ar' && gallery.titleAr ? gallery.titleAr : gallery.titleEn;
  const creatorName = creator
    ? locale === 'ar'
      ? creator.displayNameAr
      : creator.displayNameEn
    : '';

  const visitorId = await readVisitorId();
  const selected = visitorId ? getVisitorSelections(gallery.id, visitorId) : new Set<string>();
  const selectedCount = selected.size;

  const expired = gallery.expiresAt ? new Date(gallery.expiresAt) < new Date() : false;

  return (
    <main className="bg-bg min-h-dvh">
      {/* Branded header */}
      <header className="relative">
        <div className="bg-surface/5 relative h-[50vh] min-h-[360px] w-full overflow-hidden">
          <Image
            src={gallery.coverUrl}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="from-bg via-bg/70 to-bg/30 pointer-events-none absolute inset-0 bg-gradient-to-t" />
        </div>

        <div className="max-w-8xl absolute inset-x-0 top-0 z-10 mx-auto flex w-full items-center justify-between px-6 py-6 md:px-10">
          <Link href={`/${locale}`} className="text-surface flex items-center" aria-label="Hikaya">
            <Logo arabic={locale === 'ar'} className="h-6" />
          </Link>
          {creator ? (
            <Link
              href={`/${locale}/${creator.username}`}
              className="border-surface/20 bg-bg/40 text-2xs text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-3 py-1.5 backdrop-blur-sm transition-colors"
            >
              {t('byCreator', { name: creatorName })}
            </Link>
          ) : null}
        </div>

        <div className="max-w-8xl absolute inset-x-0 bottom-0 z-10 mx-auto w-full px-6 pb-10 md:px-10 md:pb-16">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {expired ? (
                <Badge tone="warning">{t('expired')}</Badge>
              ) : gallery.expiresAt ? (
                <Badge tone="neutral">
                  {t('expiresOn', {
                    date: new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }).format(new Date(gallery.expiresAt)),
                  })}
                </Badge>
              ) : null}
              {gallery.allowDownloads ? <Badge tone="sage">{t('downloadsAllowed')}</Badge> : null}
              {gallery.watermarkPreviews ? <Badge tone="info">{t('watermarked')}</Badge> : null}
            </div>
            <h1 className="text-surface text-balance text-5xl md:text-7xl">{title}</h1>
            {gallery.message ? (
              <p className="text-surface/70 max-w-2xl text-balance text-lg">{gallery.message}</p>
            ) : null}
          </div>
        </div>
      </header>

      {/* Selection summary */}
      <section className="border-surface/10 bg-bg/85 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="max-w-8xl mx-auto flex w-full items-center justify-between gap-3 px-6 py-3 md:px-10">
          <p className="text-2xs text-surface/50">
            {t('imageCount', { count: (gallery.images ?? []).length })}
          </p>
          <p className="text-2xs text-accent-secondary">
            ♥ {t('youSelected', { count: selectedCount })}
          </p>
        </div>
      </section>

      {/* Masonry */}
      <section className="max-w-8xl mx-auto w-full px-4 py-10 md:px-8">
        {(gallery.images ?? []).length === 0 ? (
          <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
            <p className="text-surface/70 text-lg">{t('emptyTitle')}</p>
            <p className="text-surface/40 mt-2 text-sm">{t('emptyHint')}</p>
          </div>
        ) : (
          <GalleryGridClient
            images={(gallery.images ?? []).map((img) => ({
              id: img.id,
              url: img.url,
              width: img.width,
              height: img.height,
              titleEn: img.titleEn,
            }))}
          >
            <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
              {(gallery.images ?? []).map((img, idx) => {
                const isSelected = selected.has(img.id);
                return (
                  <figure
                    key={img.id}
                    data-lightbox-index={idx}
                    className="bg-surface/5 group relative cursor-pointer overflow-hidden rounded-md"
                  >
                    <div className="relative" style={{ aspectRatio: `${img.width} / ${img.height}` }}>
                      <Image
                        src={img.url}
                        alt={img.titleEn ?? `${title} — ${idx + 1}`}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className={cn(
                          'duration-cinematic object-cover transition-transform ease-out group-hover:scale-[1.01]',
                          gallery.watermarkPreviews && 'opacity-95',
                        )}
                      />

                      {gallery.watermarkPreviews ? (
                        <div className="text-surface/30 pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="font-display rotate-[-30deg] text-3xl tracking-widest md:text-5xl">
                            {creatorName.toUpperCase()}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={cn(
                        'absolute inset-x-2 top-2 flex items-center justify-end opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100',
                        isSelected && 'opacity-100',
                      )}
                    >
                      <HeartButton
                        locale={locale}
                        shareSlug={gallery.shareSlug}
                        imageId={img.id}
                        initialSelected={isSelected}
                      />
                    </div>
                  </figure>
                );
              })}
            </div>
          </GalleryGridClient>
        )}
      </section>

      <footer className="border-surface/5 border-t">
        <div className="max-w-8xl mx-auto flex w-full items-center justify-between gap-3 px-6 py-8 md:px-10">
          <Link
            href={`/${locale}`}
            className="text-surface/70 hover:text-surface flex items-center"
          >
            <Logo arabic={locale === 'ar'} className="h-5" />
          </Link>
          <p className="text-2xs text-surface/40">{t('footerNote')}</p>
        </div>
      </footer>
    </main>
  );
}
