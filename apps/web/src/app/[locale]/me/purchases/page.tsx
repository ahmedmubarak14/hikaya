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
  const { bought } = await searchParams;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/purchases`);

  const t = await getTranslations('store.purchases');
  const orders = listOrdersByBuyer(session.user.id);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-6 py-22 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">{t('eyebrow')}</Badge>
          <h1 className="text-balance text-5xl">{t('headline')}</h1>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
        </header>

        {bought ? (
          <Card className="mb-8 border-sage/40 bg-sage/10">
            <CardBody className="flex flex-col gap-1 p-5">
              <span className="font-mono text-2xs uppercase tracking-widest text-sage [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('purchasedLabel')}
              </span>
              <p className="text-sm text-surface/80">{t('purchasedBody')}</p>
            </CardBody>
          </Card>
        ) : null}

        {orders.length === 0 ? (
          <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-10 text-center">
            <p className="text-lg text-surface/70">{t('empty')}</p>
            <p className="mt-2 text-sm text-surface/40">{t('emptyHint')}</p>
            <Link
              href={`/${locale}/discover`}
              className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02]"
            >
              {t('discoverCta')}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.flatMap((order) =>
              order.items.map((item) => {
                const product = getProductById(item.productId);
                const expired = new Date(item.downloadExpiresAt) < new Date();
                const cover = product?.previewImageUrls[0];
                return (
                  <li key={`${order.id}-${item.productId}`}>
                    <Card>
                      <CardBody className="grid grid-cols-[80px_1fr] gap-4 p-4 md:grid-cols-[100px_1fr_auto]">
                        <div className="relative aspect-square overflow-hidden rounded-md bg-surface/5">
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
                          <h3 className="text-base text-surface">{item.productTitleEn}</h3>
                          <p className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                            {t('purchasedAt', { when: formatDateTime(order.createdAt, locale) })}
                            {' · '}
                            {formatSarFromHalalas(item.unitHalalas, locale)}
                          </p>
                        </div>
                        <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 md:col-span-1">
                          {expired ? (
                            <span className="rounded-full border border-surface/15 px-3 py-1 font-mono text-2xs uppercase tracking-widest text-surface/50 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                              {t('expired')}
                            </span>
                          ) : product ? (
                            <a
                              href={`${product.fileUrl}?token=${item.downloadToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-ink transition-transform hover:scale-[1.02]"
                            >
                              {t('download')}
                            </a>
                          ) : null}
                          {!expired ? (
                            <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                              {t('linkExpires', { when: formatDateTime(item.downloadExpiresAt, locale) })}
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
