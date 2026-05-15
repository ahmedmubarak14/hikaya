import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { DisciplineTag } from '@/components/creators/discipline-tag';
import { type Locale } from '@/i18n/config';
import { formatDate, formatSarFromHalalas } from '@/lib/format';
import type { Job } from '@/lib/jobs/mock-data';

import { JobStatusBadge } from './job-status-badge';

interface Props {
  job: Job;
  /** Optional applicant count badge — used on /me/jobs (poster view). */
  applicationCount?: number;
}

export function JobCard({ job, applicationCount }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations('jobs.card');
  const tCity = useTranslations('cities');

  return (
    <Link href={`/${locale}/jobs/${job.id}`} className="block">
      <Card interactive className="overflow-hidden">
        <CardBody className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <DisciplineTag discipline={job.discipline} tone="accent" />
              <span className="text-2xs text-surface/50">{tCity(job.city as 'RIYADH')}</span>
            </div>
            <JobStatusBadge status={job.status} />
          </div>

          <h3 className="text-surface text-balance text-xl">{job.title}</h3>

          <p className="text-surface/60 line-clamp-2 max-w-prose text-sm">{job.description}</p>

          <div className="text-2xs flex flex-wrap items-center justify-between gap-3">
            <span className="text-surface/50 font-mono">
              {job.postedByCompany ?? job.postedByName} ·{' '}
              {t('deadline', { date: formatDate(job.deadline, locale) })}
            </span>
            <div className="text-surface flex items-center gap-2 font-mono tabular-nums">
              {job.budgetIsOpen ? (
                <Badge tone="purple">{t('openToProposals')}</Badge>
              ) : job.budgetHalalas ? (
                <span>{formatSarFromHalalas(job.budgetHalalas, locale)}</span>
              ) : null}
              {applicationCount !== undefined ? (
                <Badge tone={applicationCount > 0 ? 'accent' : 'neutral'}>
                  {t('applicants', { count: applicationCount })}
                </Badge>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
