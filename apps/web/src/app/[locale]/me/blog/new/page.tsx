import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PostEditor } from '@/components/blog/post-editor';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog.owner' });
  return { title: t('new') };
}

export default async function NewPostPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/blog/new`);

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) redirect(`/${locale}/me/portfolio`);

  const t = await getTranslations('blog.owner');

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/blog`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('backToList')}
          </Link>
          <h1 className="text-balance text-4xl">{t('new')}</h1>
        </header>

        <PostEditor locale={locale} />
      </div>
  );
}
