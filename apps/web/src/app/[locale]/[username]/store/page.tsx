import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { ProductCard } from '@/components/store/product-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getCreatorByUsername } from '@/lib/creators/queries';
import { listActiveProductsByCreator } from '@/lib/store/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; username: string }>;
}

export async function generateStaticParams() {
  const { CREATORS } = await import('@/lib/creators/mock-data');
  const { locales } = await import('@/i18n/config');
  return locales.flatMap((locale) =>
    CREATORS.map((c) => ({ locale, username: c.username })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const creator = await getCreatorByUsername(username);
  if (!creator) return {};
  const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;
  const t = await getTranslations({ locale, namespace: 'store.public' });
  return { title: t('title', { name }) };
}

export default async function PublicStorePage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  const products = listActiveProductsByCreator(creator.id);
  const t = await getTranslations('store.public');

  const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-22 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/${creator.username}`}
            className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
          >
            ← {t('backToProfile', { name })}
          </Link>
          <Badge tone="accent" className="self-start">{t('eyebrow')}</Badge>
          <h1 className="text-balance text-5xl md:text-6xl">
            <em className="font-display italic text-accent">{name}'s</em> {t('headline')}
          </h1>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
        </header>

        {products.length === 0 ? (
          <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-10 text-center">
            <p className="text-lg text-surface/70">{t('empty')}</p>
            <p className="mt-2 text-sm text-surface/40">{t('emptyHint')}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} href={`/${locale}/${creator.username}/store/${p.slug}`} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
