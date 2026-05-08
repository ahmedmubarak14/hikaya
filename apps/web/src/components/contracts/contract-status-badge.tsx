import { useTranslations } from 'next-intl';

import { Badge } from '@hikaya/ui';

import type { ContractStatus } from '@/lib/contracts/mock-data';

const TONE: Record<ContractStatus, 'neutral' | 'accent' | 'sage' | 'warning' | 'info' | 'purple'> = {
  DRAFT: 'neutral',
  SENT: 'info',
  CREATOR_SIGNED: 'purple',
  CLIENT_SIGNED: 'purple',
  SIGNED: 'sage',
  CANCELLED: 'warning',
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const t = useTranslations('contracts.status');
  return <Badge tone={TONE[status]}>{t(status as 'DRAFT')}</Badge>;
}
