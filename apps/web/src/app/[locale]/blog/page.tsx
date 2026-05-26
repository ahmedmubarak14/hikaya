import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { EmptyState } from '@/components/empty-state';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { listAllPublishedPosts } from '@/lib/blog/queries';
import { estimateReadingMinutes, splitParagraphs } from '@/lib/blog/utils';
import { getCreatorById } from '@/lib/creators/mock-store';
import { formatDate } from '@/lib/format';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog.feed' });
  return { title: t('title') };
}

/**
 * Cross-creator journal feed. Aggregates every published post on Hikaya and
 * orders newest-first. The header nav's "Journal" link points here; the
 * per-creator blog list at `/[locale]/[username]/blog` is still the right
 * surface when you want a single author's archive.
 */
export default async function JournalFeedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = await listAllPublishedPosts();
  const t = await getTranslations('blog.feed');

  return (
    <>
      <SiteHeader />
      <main className="pb-22 mx-auto w-full max-w-6xl px-6 pt-10 md:px-10 md:pt-14">
        <header className="mb-10 flex max-w-3xl flex-col gap-3">
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {t('title')}
          </h1>
          <p className="text-surface/60">{t('subtitle')}</p>
        </header>

        {posts.length === 0 ? (
          <EmptyState
            title={t('empty')}
            subtitle={t('emptySubtitle')}
            ctaLabel={t('emptyCta')}
            ctaHref={`/${locale}/sign-up`}
            icon={'\u{270F}\u{FE0F}'}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {posts.map((p) => {
              const creator = getCreatorById(p.creatorId);
              if (!creator) return null;
              const title = locale === 'ar' && p.titleAr ? p.titleAr : p.titleEn;
              const body = locale === 'ar' && p.bodyAr ? p.bodyAr : p.bodyEn;
              const firstParagraph = splitParagraphs(body)[0] ?? '';
              const minutes = estimateReadingMinutes(body);
              const date = p.publishedAt ?? p.createdAt;
              const creatorName = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;
              return (
                <li key={p.id}>
                  <Link
                    href={`/${locale}/${creator.username}/blog/${p.slug}`}
                    className="group block"
                  >
                    {p.coverUrl ? (
                      <div className="border-surface/10 bg-surface/5 relative mb-5 aspect-[16/9] w-full overflow-hidden rounded-xl border">
                        <Image
                          src={p.coverUrl}
                          alt={title}
                          fill
                          sizes="(min-width: 1024px) 45vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <div className="border-surface/10 from-accent/20 via-accent-secondary/10 to-info/15 mb-5 aspect-[16/9] w-full overflow-hidden rounded-xl border bg-gradient-to-br" />
                    )}

                    <div className="flex flex-col gap-3">
                      <div className="text-2xs text-surface/40 flex items-center gap-2">
                        <span>{formatDate(date, locale)}</span>
                        <span
                          aria-hidden
                          className="bg-surface/30 inline-block h-1 w-1 rounded-full"
                        />
                        <span>{t('readingTime', { minutes })}</span>
                      </div>

                      <h3 className="text-surface group-hover:text-accent-secondary text-balance text-2xl font-bold tracking-tight transition-colors">
                        {title}
                      </h3>

                      <p className="text-surface/70 line-clamp-3">{firstParagraph}</p>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="bg-surface/10 relative h-6 w-6 overflow-hidden rounded-full">
                          <Image
                            src={creator.avatarUrl}
                            alt=""
                            fill
                            sizes="24px"
                            className="object-cover"
                          />
                        </span>
                        <span className="text-surface/70 text-sm">{creatorName}</span>
                      </div>

                      {(p.tags ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(p.tags ?? []).slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="bg-surface/5 text-2xs text-surface/60 rounded-full px-2.5 py-1"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
