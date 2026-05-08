import { useTranslations } from 'next-intl';

import { Badge } from '@hikaya/ui';

import type { JobStatus } from '@/lib/jobs/mock-data';

const TONE: Record<JobStatus, 'neutral' | 'sage' | 'warning' | 'info'> = {
  OPEN: 'sage',
  FILLED: 'info',
  EXPIRED: 'neutral',
  CLOSED: 'warning',
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const t = useTranslations('jobs.status');
  return <Badge tone={TONE[status]}>{t(status as 'OPEN')}</Badge>;
}
