import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { ProductForm } from '@/components/store/product-form';
import { StatusButton } from '@/components/store/status-button';
import { SiteHeader } from '@/components/site-header';
import { CopyLinkButton } from '@/components/galleries/copy-link-button';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatSarFromHalalas } from '@/lib/format';
import { commissionFor, creatorTakeFor } from '@/lib/store/mock-data';
import { getProductById } from '@/lib/store/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

// Auth-gated route — generate one placeholder per locale so Next has
// when EXPORT=1, so the placeholder id is never actually used.
export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  const { listAllProductsByCreator } = await import('@/lib/store/mock-store');
  const items = listAllProductsByCreator('cr_noor');
  return locales.flatMap((locale) => {
    const real = items.map((item) => ({ locale, id: item.id }));
    // Always include a `_demo` placeholder so Next has a path to render
    // even when no items have been seeded for this entity.
    return real.length > 0 ? real : [{ locale, id: '_demo' }];
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const product = getProductById(id);
  if (!product) return {};
  const t = await getTranslations({ locale, namespace: 'store.detail' });
  return { title: `${t('title')} · ${product.titleEn}` };
}

export default async function EditProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/store/${id}`);

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) redirect(`/${locale}/me/store`);

  const product = getProductById(id);
  if (!product || product.creatorId !== creator.id) notFound();

  const t = await getTranslations('store.detail');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const shareUrl = `${baseUrl}/${locale}/${creator.username}/store/${product.slug}`;

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-4xl px-6 md:px-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/store`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('back')}
          </Link>
          <h1 className="text-balance text-4xl">{t('headline', { title: product.titleEn })}</h1>
          <p className="text-2xs text-surface/40">
            {t('breakdown', {
              total: formatSarFromHalalas(product.priceHalalas, locale),
              take: formatSarFromHalalas(creatorTakeFor(product.priceHalalas), locale),
              commission: formatSarFromHalalas(commissionFor(product.priceHalalas), locale),
            })}
          </p>
        </header>

        {/* State / share */}
        {product.status === 'ACTIVE' ? (
          <Card className="border-sage/30 bg-sage/10 mb-6">
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge tone="sage" className="self-start">
                  {t('liveLabel')}
                </Badge>
                <p className="text-surface/70 mt-2 text-sm">{t('liveBody')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CopyLinkButton url={shareUrl} />
                <Link
                  href={`/${locale}/${creator.username}/store/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-4 py-2 text-sm transition-colors"
                >
                  {t('preview')} ↗
                </Link>
                <StatusButton locale={locale} productId={product.id} to="DRAFT" variant="outline" />
              </div>
            </CardBody>
          </Card>
        ) : product.status === 'DRAFT' ? (
          <Card className="mb-6">
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge tone="neutral" className="self-start">
                  {t('draftLabel')}
                </Badge>
                <p className="text-surface/70 mt-2 text-sm">{t('draftBody')}</p>
              </div>
              <StatusButton locale={locale} productId={product.id} to="ACTIVE" variant="primary" />
            </CardBody>
          </Card>
        ) : (
          <Card className="border-accent-secondary/30 bg-accent-secondary/5 mb-6">
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge tone="warning" className="self-start">
                  {t('archivedLabel')}
                </Badge>
                <p className="text-surface/70 mt-2 text-sm">{t('archivedBody')}</p>
              </div>
              <StatusButton locale={locale} productId={product.id} to="DRAFT" variant="outline" />
            </CardBody>
          </Card>
        )}

        <ProductForm locale={locale} product={product} />

        {/* Danger zone */}
        {product.status !== 'ARCHIVED' ? (
          <div className="border-accent-secondary/30 bg-accent-secondary/5 mt-10 rounded-xl border p-5">
            <h3 className="text-surface mb-2 text-lg">{t('archiveTitle')}</h3>
            <p className="text-surface/50 mb-4 text-xs">{t('archiveHint')}</p>
            <StatusButton
              locale={locale}
              productId={product.id}
              to="ARCHIVED"
              variant="destructive"
              confirmKey="archiveConfirm"
            />
          </div>
        ) : null}
      </main>
    </>
  );
}
