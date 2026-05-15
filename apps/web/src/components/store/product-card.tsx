import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { Card, CardBody } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { formatSarFromHalalas } from '@/lib/format';
import type { Product } from '@/lib/store/mock-data';

import { CategoryBadge } from './category-badge';

interface Props {
  product: Product;
  /** Public storefront URL; the username comes from the page that owns it. */
  href: string;
}

export function ProductCard({ product, href }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations('store.card');

  const title = locale === 'ar' && product.titleAr ? product.titleAr : product.titleEn;
  const cover = product.previewImageUrls[0];

  return (
    <Link href={href} className="group block">
      <Card interactive className="overflow-hidden">
        <div className="bg-surface/5 relative aspect-[4/3] w-full overflow-hidden">
          {cover ? (
            <Image
              src={cover}
              alt={title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="duration-cinematic object-cover transition-transform ease-out group-hover:scale-[1.03]"
            />
          ) : null}
          <div className="from-bg via-bg/30 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4">
            <CategoryBadge category={product.category} />
            {product.salesCount > 0 ? (
              <span className="bg-bg/70 text-2xs text-surface/70 rounded-full px-2.5 py-1 font-mono backdrop-blur-sm">
                {t('sales', { count: product.salesCount })}
              </span>
            ) : null}
          </div>
        </div>

        <CardBody className="flex flex-col gap-2 p-5">
          <h3 className="text-surface line-clamp-2 text-lg">{title}</h3>
          <div className="flex items-baseline justify-between">
            <span className="text-accent-secondary text-2xl font-bold tabular-nums tracking-tight">
              {formatSarFromHalalas(product.priceHalalas, locale)}
            </span>
            {product.compatibleSoftware.length > 0 ? (
              <span className="text-2xs text-surface/40 line-clamp-1">
                {product.compatibleSoftware[0]}
                {product.compatibleSoftware.length > 1
                  ? ` +${product.compatibleSoftware.length - 1}`
                  : ''}
              </span>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
