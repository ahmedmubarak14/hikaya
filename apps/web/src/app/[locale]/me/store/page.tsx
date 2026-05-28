import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button, Card, CardBody } from '@hikaya/ui';

import { EmptyState } from '@/components/empty-state';
import { CategoryBadge } from '@/components/store/category-badge';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatSarFromHalalas } from '@/lib/format';
import { commissionFor, creatorTakeFor, type ProductStatus } from '@/lib/store/mock-data';
import { listAllProductsByCreator } from '@/lib/store/mock-store';

import type { Metadata } from 'next';

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

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/store`);

  const t = await getTranslations('store.list');
  const tStatus = await getTranslations('store.status');

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) {
    return (
      <div className="mx-auto w-full max-w-3xl px-8 py-10">
          <Card>
            <CardBody className="flex flex-col gap-3 p-8">
              <Badge tone="warning" className="self-start">
                {t('clientLabel')}
              </Badge>
              <h1 className="text-3xl">{t('clientTitle')}</h1>
              <p className="text-surface/60">{t('clientBody')}</p>
            </CardBody>
          </Card>
        </div>
    );
  }

  const products = listAllProductsByCreator(creator.id);

  // Aggregate take-home over all sales for the dashboard tile.
  const totalSalesHalalas = products.reduce((sum, p) => sum + p.priceHalalas * p.salesCount, 0);
  const totalTake = creatorTakeFor(totalSalesHalalas);
  const totalCommission = commissionFor(totalSalesHalalas);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
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
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="text-accent-secondary font-bold">{t('headlineItalic')}</span>
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        {/* Top-line stats */}
        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat
            label={t('stats.takeHome')}
            value={formatSarFromHalalas(totalTake, locale)}
            accent
          />
          <Stat
            label={t('stats.commission')}
            value={formatSarFromHalalas(totalCommission, locale)}
          />
          <Stat label={t('stats.products')} value={String(products.length)} />
        </section>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <span className="text-2xs text-surface/40">{t('count', { count: products.length })}</span>
          <Link href={`/${locale}/me/store/new`}>
            <Button size="md" variant="primary">
              + {t('newCta')}
            </Button>
          </Link>
        </div>

        {products.length === 0 ? (
          <EmptyState
            title={t('empty')}
            subtitle={t('emptySubtitle')}
            ctaLabel={t('newCta')}
            ctaHref={`/${locale}/me/store/new`}
            icon={'\u{1F6D2}'}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {products.map((p) => {
              const title = locale === 'ar' && p.titleAr ? p.titleAr : p.titleEn;
              return (
                <li key={p.id}>
                  <Link href={`/${locale}/me/store/${p.id}`} className="block">
                    <Card interactive className="overflow-hidden">
                      <div className="grid grid-cols-[112px_1fr] gap-4 p-3">
                        <div className="bg-surface/5 relative aspect-square overflow-hidden rounded-md">
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
                            <Badge tone={STATUS_TONE[p.status]}>{tStatus(p.status)}</Badge>
                          </div>
                          <h3 className="text-surface line-clamp-2 text-base">{title}</h3>
                          <div className="text-2xs mt-auto flex items-baseline justify-between gap-2 font-mono">
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
      </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={
        accent
          ? 'border-accent/30 bg-accent/5 flex flex-col gap-1 rounded-xl border p-5'
          : 'border-surface/10 bg-surface/[0.03] flex flex-col gap-1 rounded-xl border p-5'
      }
    >
      <span className="text-2xs text-surface/40">{label}</span>
      <span
        className={
          accent
            ? 'text-accent-secondary text-3xl font-bold tabular-nums tracking-tight'
            : 'text-surface text-3xl font-bold tabular-nums tracking-tight'
        }
      >
        {value}
      </span>
    </div>
  );
}
