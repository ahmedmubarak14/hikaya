import { useTranslations } from 'next-intl';

import { Badge } from '@hikaya/ui';

import type { QuoteStatus } from '@/lib/quotes/mock-data';

const TONE: Record<QuoteStatus, 'neutral' | 'accent' | 'sage' | 'warning' | 'info'> = {
  DRAFT: 'neutral',
  SENT: 'info',
  APPROVED: 'sage',
  REJECTED: 'warning',
  EXPIRED: 'neutral',
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const t = useTranslations('quotes.status');
  return <Badge tone={TONE[status]}>{t(status as 'DRAFT')}</Badge>;
}
