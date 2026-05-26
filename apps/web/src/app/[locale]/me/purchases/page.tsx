import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { CategoryBadge } from '@/components/store/category-badge';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { formatDateTime, formatSarFromHalalas } from '@/lib/format';
import { getProductById, listOrdersByBuyer } from '@/lib/store/mock-store';
import { IS_STATIC_EXPORT } from '@/lib/static-export';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ bought?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'store.purchases' });
  return { title: t('title') };
}

export default async function MyPurchasesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { bought } = IS_STATIC_EXPORT ? {} : await searchParams;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/purchases`);

  const t = await getTranslations('store.purchases');
  const orders = listOrdersByBuyer(session.user.id);

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-4xl px-6 md:px-10">
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
          <h1 className="text-balance text-5xl">{t('headline')}</h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        {bought ? (
          <Card className="border-sage/40 bg-sage/10 mb-8">
            <CardBody className="flex flex-col gap-1 p-5">
              <span className="text-2xs text-sage">{t('purchasedLabel')}</span>
              <p className="text-surface/80 text-sm">{t('purchasedBody')}</p>
            </CardBody>
          </Card>
        ) : null}

        {orders.length === 0 ? (
          <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
            <p className="text-surface/70 text-lg">{t('empty')}</p>
            <p className="text-surface/40 mt-2 text-sm">{t('emptyHint')}</p>
            <Link
              href={`/${locale}/discover`}
              className="bg-accent text-ink mt-6 inline-block rounded-full px-6 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]"
            >
              {t('discoverCta')}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.flatMap((order) =>
              (order.items ?? []).map((item) => {
                const product = getProductById(item.productId);
                const expired = new Date(item.downloadExpiresAt) < new Date();
                const cover = product?.previewImageUrls[0];
                return (
                  <li key={`${order.id}-${item.productId}`}>
                    <Card>
                      <CardBody className="grid grid-cols-[80px_1fr] gap-4 p-4 md:grid-cols-[100px_1fr_auto]">
                        <div className="bg-surface/5 relative aspect-square overflow-hidden rounded-md">
                          {cover ? (
                            <Image
                              src={cover}
                              alt={item.productTitleEn}
                              fill
                              sizes="100px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            {product ? <CategoryBadge category={product.category} /> : null}
                          </div>
                          <h3 className="text-surface text-base">{item.productTitleEn}</h3>
                          <p className="text-2xs text-surface/40">
                            {t('purchasedAt', { when: formatDateTime(order.createdAt, locale) })}
                            {' · '}
                            {formatSarFromHalalas(item.unitHalalas, locale)}
                          </p>
                        </div>
                        <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 md:col-span-1">
                          {expired ? (
                            <span className="border-surface/15 text-2xs text-surface/50 rounded-full border px-3 py-1">
                              {t('expired')}
                            </span>
                          ) : item.downloadToken ? (
                            <a
                              href={`/api/download/${item.downloadToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-accent text-ink rounded-full px-5 py-2 text-sm font-medium transition-transform hover:scale-[1.02]"
                            >
                              {t('download')}
                            </a>
                          ) : null}
                          {!expired ? (
                            <span className="text-2xs text-surface/40">
                              {t('linkExpires', {
                                when: formatDateTime(item.downloadExpiresAt, locale),
                              })}
                            </span>
                          ) : null}
                        </div>
                      </CardBody>
                    </Card>
                  </li>
                );
              }),
            )}
          </ul>
        )}
      </main>
    </>
  );
}
