import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { BuyButton } from '@/components/store/buy-button';
import { CategoryBadge } from '@/components/store/category-badge';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getCreatorByUsername } from '@/lib/creators/queries';
import { formatSarFromHalalas } from '@/lib/format';
import { findOrderItemForBuyer, getProductBySlug } from '@/lib/store/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; username: string; slug: string }>;
}

export async function generateStaticParams() {
  const { CREATORS } = await import('@/lib/creators/mock-data');
  const { SEED_PRODUCTS } = await import('@/lib/store/mock-data');
  const { locales } = await import('@/i18n/config');
  // Pre-render every (locale, username, slug) combination from seed data.
  const out: { locale: string; username: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const c of CREATORS) {
      for (const p of SEED_PRODUCTS) {
        if (p.creatorId === c.id && p.status === 'ACTIVE') {
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
  const product = getProductBySlug(creator.id, slug);
  if (!product) return {};
  const title = locale === 'ar' && product.titleAr ? product.titleAr : product.titleEn;
  return { title };
}

export default async function PublicProductPage({ params }: Props) {
  const { locale, username, slug } = await params;
  setRequestLocale(locale);

  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  const product = getProductBySlug(creator.id, slug);
  if (!product || product.status !== 'ACTIVE') notFound();

  const t = await getTranslations('store.product');

  const session = await getSession();
  const alreadyOwned = session
    ? Boolean(findOrderItemForBuyer(session.user.id, product.id))
    : false;
  const isOwn = session?.user.email === creator.ownerEmail;

  const title = locale === 'ar' && product.titleAr ? product.titleAr : product.titleEn;
  const description =
    locale === 'ar' && product.descriptionAr ? product.descriptionAr : product.descriptionEn;
  const creatorName = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;

  const cover = product.previewImageUrls[0];
  const rest = product.previewImageUrls.slice(1);

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-6xl px-6 md:px-10">
        <Link
          href={`/${locale}/${creator.username}/store`}
          className="text-2xs text-surface/40 hover:text-surface mb-6 inline-block transition-colors"
        >
          ← {t('backToStore', { name: creatorName })}
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr]">
          {/* Gallery */}
          <section className="flex flex-col gap-3">
            {cover ? (
              <div className="border-surface/10 bg-surface/5 relative aspect-[4/3] w-full overflow-hidden rounded-xl border">
                <Image
                  src={cover}
                  alt={title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            {rest.length > 0 ? (
              <ul className="grid grid-cols-3 gap-3">
                {rest.slice(0, 6).map((url, idx) => (
                  <li key={`${url}-${idx}`}>
                    <div className="border-surface/10 bg-surface/5 relative aspect-square overflow-hidden rounded-md border">
                      <Image
                        src={url}
                        alt={`${title} ${idx + 2}`}
                        fill
                        sizes="(min-width: 1024px) 20vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* Details */}
          <section className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={product.category} />
              {product.salesCount > 0 ? (
                <span className="text-2xs text-surface/40">
                  {t('sales', { count: product.salesCount })}
                </span>
              ) : null}
            </div>

            <h1 className="text-balance text-4xl">{title}</h1>

            <Link
              href={`/${locale}/${creator.username}`}
              className="text-2xs text-surface/40 hover:text-surface underline-offset-4 hover:underline"
            >
              {t('byCreator', { name: creatorName })}
            </Link>

            <p className="text-accent-secondary text-5xl font-bold tabular-nums tracking-tight">
              {formatSarFromHalalas(product.priceHalalas, locale)}
            </p>

            <BuyButton
              locale={locale}
              username={creator.username}
              productSlug={product.slug}
              alreadyOwned={alreadyOwned}
              isOwn={isOwn}
            />

            {product.compatibleSoftware.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.compatibleSoftware.map((s) => (
                  <Badge key={s} tone="info">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : null}

            {product.freeSampleUrl ? (
              <a
                href={product.freeSampleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface self-start rounded-full border px-4 py-2 text-sm transition-colors"
              >
                {t('downloadSample')} ↗
              </a>
            ) : null}

            <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
              <p className="text-surface/80 whitespace-pre-wrap text-sm">{description}</p>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
