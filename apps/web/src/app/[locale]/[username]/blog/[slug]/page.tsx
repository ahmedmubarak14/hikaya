import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ReportButton } from '@/components/moderation/report-button';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getPostBySlug } from '@/lib/blog/queries';
import { estimateReadingMinutes, splitParagraphs } from '@/lib/blog/utils';
import { getCreatorByUsername } from '@/lib/creators/queries';
import { formatDate } from '@/lib/format';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; username: string; slug: string }>;
}

export async function generateStaticParams() {
  const { CREATORS } = await import('@/lib/creators/mock-data');
  const { SEED_BLOG_POSTS } = await import('@/lib/blog/mock-data');
  const { locales } = await import('@/i18n/config');
  const out: { locale: string; username: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const c of CREATORS) {
      for (const p of SEED_BLOG_POSTS) {
        if (p.creatorId === c.id && p.status === 'PUBLISHED') {
          out.push({ locale, username: c.username, slug: p.slug });
        }
      }
    }
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username, slug } = await params;
  const creator = await getCreatorByUsername(username);
  if (!creator) return {};
  const post = await getPostBySlug(creator.id, slug);
  if (!post || post.status !== 'PUBLISHED') return {};

  const title = locale === 'ar' && post.titleAr ? post.titleAr : post.titleEn;
  const body = locale === 'ar' && post.bodyAr ? post.bodyAr : post.bodyEn;
  // First paragraph, trimmed, as the description — gives SEO + social
  // shares something to work with.
  const description = splitParagraphs(body)[0]?.slice(0, 280) ?? title;
  return { title, description };
}

export default async function CreatorBlogPostPage({ params }: Props) {
  const { locale, username, slug } = await params;
  setRequestLocale(locale);

  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  const post = await getPostBySlug(creator.id, slug);
  if (!post || post.status !== 'PUBLISHED') notFound();

  const t = await getTranslations('blog.post');
  const tList = await getTranslations('blog.publicList');

  const title = locale === 'ar' && post.titleAr ? post.titleAr : post.titleEn;
  const body = locale === 'ar' && post.bodyAr ? post.bodyAr : post.bodyEn;
  const paragraphs = splitParagraphs(body);
  const minutes = estimateReadingMinutes(body);
  const date = post.publishedAt ?? post.createdAt;
  const creatorName = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-3xl px-6 md:px-10">
        <Link
          href={`/${locale}/${creator.username}/blog`}
          className="text-2xs text-surface/40 hover:text-surface mb-8 inline-block transition-colors"
        >
          {t('backToList')}
        </Link>

        {post.coverUrl ? (
          <div className="border-surface/10 bg-surface/5 relative mb-10 aspect-[16/9] w-full overflow-hidden rounded-xl border">
            <Image
              src={post.coverUrl}
              alt={title}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <header className="mb-10 flex flex-col gap-6">
          <div className="text-2xs text-surface/40 flex flex-wrap items-center gap-3">
            <span>{formatDate(date, locale)}</span>
            <span aria-hidden className="bg-surface/30 inline-block h-1 w-1 rounded-full" />
            <span>{tList('readingTime', { minutes })}</span>
          </div>

          <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>

          <Link href={`/${locale}/${creator.username}`} className="group flex items-center gap-3">
            <span className="bg-surface/10 ring-surface/10 relative h-10 w-10 overflow-hidden rounded-full ring-1">
              <Image
                src={creator.avatarUrl}
                alt={creatorName}
                fill
                sizes="40px"
                className="object-cover"
              />
            </span>
            <span className="text-surface/80 group-hover:text-surface text-sm transition-colors">
              {t('byCreator', { name: creatorName })}
            </span>
          </Link>
        </header>

        <article className="flex flex-col gap-6">
          {paragraphs.map((p, idx) => (
            <p
              key={`${post.id}-p-${idx}`}
              className="text-surface/80 text-base leading-relaxed"
              dir={locale === 'ar' ? 'rtl' : undefined}
            >
              {p}
            </p>
          ))}
        </article>

        {(post.tags ?? []).length > 0 ? (
          <footer className="border-surface/10 mt-12 flex flex-col gap-3 border-t pt-6">
            <span className="text-2xs text-surface/40 uppercase tracking-wider">
              {tList('tags')}
            </span>
            <div className="flex flex-wrap gap-2">
              {(post.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="bg-surface/5 text-surface/70 rounded-full px-3 py-1 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </footer>
        ) : null}

        {/* Report button */}
        <div className="border-surface/10 mt-8 flex justify-end border-t pt-4">
          <ReportButton resourceType="BLOG_POST" resourceId={post.id} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
