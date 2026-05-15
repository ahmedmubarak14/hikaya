import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PostEditor } from '@/components/blog/post-editor';
import { PostStatusBadge } from '@/components/blog/post-status-badge';
import { DemoModeNotice } from '@/components/demo-mode-notice';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getPostById } from '@/lib/blog/queries';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { IS_STATIC_EXPORT } from '@/lib/static-export';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

// Auth-gated route — one placeholder per locale so Next has something to
// pre-render. The page short-circuits to DemoModeNotice on EXPORT=1, so the
// placeholder id is never actually used.
export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  return locales.map((locale) => ({ locale, id: '_demo' }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const post = await getPostById(id);
  if (!post) return {};
  const t = await getTranslations({ locale, namespace: 'blog.owner' });
  return { title: `${t('edit')} · ${post.titleEn}` };
}

export default async function EditPostPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

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
      <main className="mx-auto w-full max-w-3xl px-6 py-22 md:px-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/blog`}
            className="text-2xs text-surface/40 transition-colors hover:text-surface"
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
