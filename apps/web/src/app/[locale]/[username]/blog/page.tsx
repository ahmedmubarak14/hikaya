import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { listPublishedPostsByCreator } from '@/lib/blog/queries';
import { estimateReadingMinutes, splitParagraphs } from '@/lib/blog/utils';
import { getCreatorByUsername } from '@/lib/creators/queries';
import { formatDate } from '@/lib/format';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; username: string }>;
}

export async function generateStaticParams() {
  const { CREATORS } = await import('@/lib/creators/mock-data');
  const { locales } = await import('@/i18n/config');
  return locales.flatMap((locale) => CREATORS.map((c) => ({ locale, username: c.username })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const creator = await getCreatorByUsername(username);
  if (!creator) return {};
  const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;
  const t = await getTranslations({ locale, namespace: 'blog.publicList' });
  return { title: t('title', { name }) };
}

export default async function CreatorBlogListPage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  const posts = await listPublishedPostsByCreator(creator.id);
  const t = await getTranslations('blog.publicList');

  const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-6xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/${creator.username}`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {name}
          </Link>
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {t('title', { name })}
          </h1>
        </header>

        {posts.length === 0 ? (
          <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
            <p className="text-surface/70 text-lg">{t('empty')}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {posts.map((p) => {
              const title = locale === 'ar' && p.titleAr ? p.titleAr : p.titleEn;
              const body = locale === 'ar' && p.bodyAr ? p.bodyAr : p.bodyEn;
              const firstParagraph = splitParagraphs(body)[0] ?? '';
              const minutes = estimateReadingMinutes(body);
              const date = p.publishedAt ?? p.createdAt;
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

                      {(p.tags ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
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
