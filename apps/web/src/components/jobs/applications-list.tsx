'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Badge, Button, Card, CardBody, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { setApplicationStatusAction } from '@/lib/jobs/actions';
import type { JobApplication, JobApplicationStatus } from '@/lib/jobs/mock-data';
import { formatSarFromHalalas } from '@/lib/format';

interface Props {
  locale: Locale;
  applications: JobApplication[];
}

const TONE: Record<JobApplicationStatus, 'neutral' | 'sage' | 'warning' | 'accent'> = {
  SUBMITTED: 'neutral',
  SHORTLISTED: 'accent',
  REJECTED: 'warning',
  ACCEPTED: 'sage',
};

export function ApplicationsList({ locale, applications }: Props) {
  const t = useTranslations('jobs.applications');
  const tStatus = useTranslations('jobs.applicationStatus');
  const [isPending, startTransition] = useTransition();

  if (applications.length === 0) {
    return (
      <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-8 text-center">
        <p className="text-surface/70 text-base">{t('empty')}</p>
        <p className="text-surface/40 mt-2 text-sm">{t('emptyHint')}</p>
      </div>
    );
  }

  const decide = (id: string, status: 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED') => {
    startTransition(async () => {
      await setApplicationStatusAction(locale, id, status);
    });
  };

  return (
    <ul
      className={cn('flex flex-col gap-3', isPending && 'opacity-70')}
      aria-busy={isPending || undefined}
    >
      {applications.map((a) => (
        <li key={a.id}>
          <Card>
            <CardBody className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/${locale}/${a.applicantUsername}`}
                    className="text-surface text-base underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {a.applicantName} ↗
                  </Link>
                  <span className="text-2xs text-surface/40">@{a.applicantUsername}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={TONE[a.status]}>{tStatus(a.status as 'SUBMITTED')}</Badge>
                </div>
              </div>

              <p className="text-surface/80 whitespace-pre-wrap text-sm">{a.coverNote}</p>

              <div className="border-surface/10 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <span className="text-surface/80 font-mono text-sm tabular-nums">
                  {formatSarFromHalalas(a.proposedRateHalalas, locale)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={a.status === 'SHORTLISTED' ? 'primary' : 'outline'}
                    onClick={() => decide(a.id, 'SHORTLISTED')}
                    disabled={a.status === 'ACCEPTED'}
                  >
                    {t('shortlist')}
                  </Button>
                  <Button
                    size="sm"
                    variant={a.status === 'ACCEPTED' ? 'primary' : 'outline'}
                    onClick={() => decide(a.id, 'ACCEPTED')}
                  >
                    {t('accept')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => decide(a.id, 'REJECTED')}
                    disabled={a.status === 'REJECTED'}
                  >
                    {t('reject')}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}
