import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ProductForm } from '@/components/store/product-form';
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
  const t = await getTranslations({ locale, namespace: 'store.new' });
  return { title: t('title') };
}

export default async function NewProductPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/store/new`);

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) redirect(`/${locale}/me/store`);

  const t = await getTranslations('store.new');

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-22 md:px-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/store`}
            className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
          >
            ← {t('back')}
          </Link>
          <h1 className="text-balance text-4xl">{t('title')}</h1>
          <p className="text-surface/60">{t('subtitle')}</p>
        </header>

        <ProductForm locale={locale} />
      </main>
    </>
  );
}
