import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CreateGalleryForm } from '@/components/galleries/create-gallery-form';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';

import type { Metadata } from 'next';

import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { DemoModeNotice } from '@/components/demo-mode-notice';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gallery.create' });
  return { title: t('title') };
}

export default async function NewGalleryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/galleries/new`);

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) redirect(`/${locale}/me/galleries`);

  const t = await getTranslations('gallery.create');

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-2xl px-6 md:px-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/galleries`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('back')}
          </Link>
          <h1 className="text-balance text-4xl">{t('title')}</h1>
          <p className="text-surface/60">{t('subtitle')}</p>
        </header>

        <CreateGalleryForm locale={locale} />
      </main>
    </>
  );
}
