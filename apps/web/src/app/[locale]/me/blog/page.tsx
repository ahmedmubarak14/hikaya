import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button, Card, CardBody } from '@hikaya/ui';

import { DeletePostButton } from '@/components/blog/delete-post-button';
import { PostStatusBadge } from '@/components/blog/post-status-badge';
import { PublishPostButton } from '@/components/blog/publish-post-button';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import type { BlogPost } from '@/lib/blog/mock-data';
import { listPostsByCreator } from '@/lib/blog/queries';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatDate } from '@/lib/format';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog.owner' });
  return { title: t('title') };
}

export default async function MyBlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/blog`);

  const t = await getTranslations('blog.owner');

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) {
    return (
      <>
        <SiteHeader />
        <main className="py-22 mx-auto w-full max-w-3xl px-6 md:px-10">
          <Card>
            <CardBody className="flex flex-col gap-3 p-8">
              <Badge tone="warning" className="self-start">
                {t('clientLabel')}
              </Badge>
              <h1 className="text-3xl">{t('clientTitle')}</h1>
              <p className="text-surface/60">{t('clientBody')}</p>
            </CardBody>
          </Card>
        </main>
      </>
    );
  }

  const posts = await listPostsByCreator(creator.id);
  const published = posts.filter((p) => p.status === 'PUBLISHED');
  const drafts = posts.filter((p) => p.status === 'DRAFT');

  const editLabel = t('edit');

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-5xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              {t('title')}
            </h1>
            <Link href={`/${locale}/me/blog/new`}>
              <Button size="md" variant="primary">
                {t('new')}
              </Button>
            </Link>
          </div>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        {posts.length === 0 ? (
          <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
            <p className="text-surface/70 text-lg">{t('empty')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {published.length > 0 ? (
              <section>
                <h2 className="text-surface/50 mb-4 text-xs font-medium uppercase tracking-wider">
                  {t('published')}
                  <span className="text-surface/30 ms-2">({published.length})</span>
                </h2>
                <ul className="flex flex-col gap-3">
                  {published.map((p) => (
                    <PostRow
                      key={p.id}
                      post={p}
                      locale={locale}
                      username={creator.username}
                      editLabel={editLabel}
                    />
                  ))}
                </ul>
              </section>
            ) : null}

            {drafts.length > 0 ? (
              <section>
                <h2 className="text-surface/50 mb-4 text-xs font-medium uppercase tracking-wider">
                  {t('drafts')}
                  <span className="text-surface/30 ms-2">({drafts.length})</span>
                </h2>
                <ul className="flex flex-col gap-3">
                  {drafts.map((p) => (
                    <PostRow
                      key={p.id}
                      post={p}
                      locale={locale}
                      username={creator.username}
                      editLabel={editLabel}
                    />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </>
  );
}

function PostRow({
  post,
  locale,
  username,
  editLabel,
}: {
  post: BlogPost;
  locale: Locale;
  username: string;
  editLabel: string;
}) {
  const title = locale === 'ar' && post.titleAr ? post.titleAr : post.titleEn;
  const date = post.publishedAt ?? post.updatedAt;
  return (
    <li>
      <Card>
        <CardBody className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <PostStatusBadge status={post.status} />
              <span className="text-2xs text-surface/40">{formatDate(date, locale)}</span>
              {post.status === 'PUBLISHED' ? (
                <Link
                  href={`/${locale}/${username}/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xs text-surface/50 hover:text-surface underline-offset-4 hover:underline"
                >
                  /{post.slug} ↗
                </Link>
              ) : null}
            </div>
            <h3 className="text-surface text-base font-medium">{title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/${locale}/me/blog/${post.id}`}>
              <Button size="sm" variant="outline">
                {editLabel}
              </Button>
            </Link>
            <PublishPostButton locale={locale} postId={post.id} status={post.status} />
            <DeletePostButton locale={locale} postId={post.id} />
          </div>
        </CardBody>
      </Card>
    </li>
  );
}
