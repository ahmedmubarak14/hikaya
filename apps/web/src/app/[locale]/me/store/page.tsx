import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button, Card, CardBody } from '@hikaya/ui';

import { CategoryBadge } from '@/components/store/category-badge';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatSarFromHalalas } from '@/lib/format';
import { commissionFor, creatorTakeFor, type ProductStatus } from '@/lib/store/mock-data';
import { listAllProductsByCreator } from '@/lib/store/mock-store';

import type { Metadata } from 'next';

import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { DemoModeNotice } from '@/components/demo-mode-notice';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'store.list' });
  return { title: t('title') };
}

const STATUS_TONE: Record<ProductStatus, 'neutral' | 'sage' | 'warning'> = {
  DRAFT: 'neutral',
  ACTIVE: 'sage',
  ARCHIVED: 'warning',
};

export default async function MyStorePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/store`);

  const t = await getTranslations('store.list');
  const tStatus = await getTranslations('store.status');

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl px-6 py-22 md:px-10">
          <Card>
            <CardBody className="flex flex-col gap-3 p-8">
              <Badge tone="warning" className="self-start">{t('clientLabel')}</Badge>
              <h1 className="text-3xl">{t('clientTitle')}</h1>
              <p className="text-surface/60">{t('clientBody')}</p>
            </CardBody>
          </Card>
        </main>
      </>
    );
  }

  const products = listAllProductsByCreator(creator.id);

  // Aggregate take-home over all sales for the dashboard tile.
  const totalSalesHalalas = products.reduce(
    (sum, p) => sum + p.priceHalalas * p.salesCount,
    0,
  );
  const totalTake = creatorTakeFor(totalSalesHalalas);
  const totalCommission = commissionFor(totalSalesHalalas);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-22 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">{t('eyebrow')}</Badge>
          <h1 className="text-balance text-5xl md:text-6xl">
            <span>{t('headline')}</span>{' '}
            <em className="font-display italic text-accent">{t('headlineItalic')}</em>
          </h1>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
        </header>

        {/* Top-line stats */}
        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat label={t('stats.takeHome')} value={formatSarFromHalalas(totalTake, locale)} accent />
          <Stat label={t('stats.commission')} value={formatSarFromHalalas(totalCommission, locale)} />
          <Stat label={t('stats.products')} value={String(products.length)} />
        </section>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
            {t('count', { count: products.length })}
          </span>
          <Link href={`/${locale}/me/store/new`}>
            <Button size="md" variant="primary">+ {t('newCta')}</Button>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-10 text-center">
            <p className="text-lg text-surface/70">{t('empty')}</p>
            <p className="mt-2 text-sm text-surface/40">{t('emptyHint')}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {products.map((p) => {
              const title = locale === 'ar' && p.titleAr ? p.titleAr : p.titleEn;
              return (
                <li key={p.id}>
                  <Link href={`/${locale}/me/store/${p.id}`} className="block">
                    <Card interactive className="overflow-hidden">
                      <div className="grid grid-cols-[112px_1fr] gap-4 p-3">
                        <div className="relative aspect-square overflow-hidden rounded-md bg-surface/5">
                          {p.previewImageUrls[0] ? (
                            <Image
                              src={p.previewImageUrls[0]}
                              alt={title}
                              fill
                              sizes="112px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-2 py-1">
                          <div className="flex items-center justify-between gap-2">
                            <CategoryBadge category={p.category} />
                            <Badge tone={STATUS_TONE[p.status]}>{tStatus(p.status as 'DRAFT')}</Badge>
                          </div>
                          <h3 className="line-clamp-2 text-base text-surface">{title}</h3>
                          <div className="mt-auto flex items-baseline justify-between gap-2 font-mono text-2xs">
                            <span className="text-surface/70 tabular-nums">
                              {formatSarFromHalalas(p.priceHalalas, locale)}
                            </span>
                            <span className="text-surface/40 [lang=ar]:font-sansAr">
                              {t('rowSales', { count: p.salesCount })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={
        accent
          ? 'flex flex-col gap-1 rounded-xl border border-accent/30 bg-accent/5 p-5'
          : 'flex flex-col gap-1 rounded-xl border border-surface/10 bg-surface/[0.03] p-5'
      }
    >
      <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
        {label}
      </span>
      <span className={accent ? 'font-display text-3xl text-accent' : 'font-display text-3xl text-surface'}>
        {value}
      </span>
    </div>
  );
}
