import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PostEditor } from '@/components/blog/post-editor';
import { PostStatusBadge } from '@/components/blog/post-status-badge';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getPostById } from '@/lib/blog/queries';
import { getMyCreatorProfile } from '@/lib/creators/queries';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

// Auth-gated route — one placeholder per locale so Next has something to
// placeholder id is never actually used.
export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  const { getPostsByCreator } = await import('@/lib/blog/mock-store');
  const items = getPostsByCreator('cr_noor');
  return locales.flatMap((locale) => {
    const real = items.map((item) => ({ locale, id: item.id }));
    // Always include a `_demo` placeholder so Next has a path to render
    // even when no items have been seeded for this entity.
    return real.length > 0 ? real : [{ locale, id: '_demo' }];
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Don't leak post.titleEn here — generateMetadata runs before the page's
  // auth+ownership check. Anyone holding a valid id could otherwise read a
  // private draft's title via this route's HTML <title>. Generic label only.
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog.owner' });
  return { title: t('edit') };
}

export default async function EditPostPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/blog/${id}`);

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) redirect(`/${locale}/me/blog`);

  const post = await getPostById(id);
  if (!post || post.creatorId !== creator.id) notFound();

  const t = await getTranslations('blog.owner');

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-3xl px-6 md:px-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/blog`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('backToList')}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-balance text-4xl">{post.titleEn}</h1>
            <PostStatusBadge status={post.status} />
          </div>
        </header>

        <PostEditor locale={locale} post={post} />
      </main>
    </>
  );
}
