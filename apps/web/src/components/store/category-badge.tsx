import { useTranslations } from 'next-intl';

import { Badge } from '@hikaya/ui';

import type { ProductCategory } from '@/lib/store/mock-data';

const TONE: Record<ProductCategory, 'neutral' | 'accent' | 'sage' | 'info' | 'purple' | 'warning'> = {
  PRESET: 'accent',
  LUT: 'purple',
  TEMPLATE: 'info',
  OVERLAY: 'sage',
  GUIDE: 'warning',
  OTHER: 'neutral',
};

export function CategoryBadge({ category }: { category: ProductCategory }) {
  const t = useTranslations('store.category');
  return <Badge tone={TONE[category]}>{t(category as 'PRESET')}</Badge>;
}
