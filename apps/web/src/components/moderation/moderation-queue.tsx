'use client';

import { useState, useTransition } from 'react';

import { useTranslations } from 'next-intl';

import { Badge, Card, CardBody } from '@hikaya/ui';

import {
  reviewReportAction,
  type ReportRow,
} from '@/lib/moderation/actions';

interface Props {
  initialReports: ReportRow[];
}

export function ModerationQueue({ initialReports }: Props) {
  const t = useTranslations('admin');
  const tMod = useTranslations('moderation');
  const [reports, setReports] = useState(initialReports);
  const [isPending, startTransition] = useTransition();

  const handleAction = (
    reportId: string,
    action: 'DISMISS' | 'TAKE_ACTION',
    suspendUserId?: string,
  ) => {
    startTransition(async () => {
      const result = await reviewReportAction(reportId, action, suspendUserId);
      if (result.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    });
  };

  if (reports.length === 0) {
    return (
      <Card>
        <CardBody className="p-8 text-center">
          <p className="text-surface/60 text-lg">{t('moderationEmpty')}</p>
          <p className="text-surface/40 mt-2 text-sm">{t('moderationEmptyHint')}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardBody className="flex flex-col gap-3 p-5">
            {/* Header row: reporter + date */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="warning">
                  {tMod(`reasons.${report.reason}` as Parameters<typeof tMod>[0])}
                </Badge>
                <span className="text-surface/50 text-xs">
                  {tMod('resourceLabel', {
                    type: report.resourceType,
                    id: report.resourceId.slice(0, 8),
                  })}
                </span>
              </div>
              <time className="text-surface/40 text-xs" dateTime={report.createdAt}>
                {new Date(report.createdAt).toLocaleDateString()}
              </time>
            </div>

            {/* Reporter */}
            <p className="text-surface/70 text-sm">
              {tMod('reportedBy', { name: report.reporterName })}
            </p>

            {/* Description */}
            {report.description ? (
              <p className="text-surface/60 text-sm">{report.description}</p>
            ) : null}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAction(report.id, 'DISMISS')}
                disabled={isPending}
                className="border-surface/20 text-surface/60 hover:border-surface/40 hover:text-surface rounded-full border px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {t('moderationDismiss')}
              </button>
              <button
                type="button"
                onClick={() => handleAction(report.id, 'TAKE_ACTION')}
                disabled={isPending}
                className="border-red-500/30 text-red-500 hover:border-red-500/60 hover:bg-red-500/5 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {t('moderationTakeAction')}
              </button>
              <button
                type="button"
                onClick={() => handleAction(report.id, 'TAKE_ACTION', report.reporterId)}
                disabled={isPending}
                className="text-surface/40 hover:text-red-500 text-xs transition-colors disabled:opacity-50"
                title={t('moderationSuspendHint')}
              >
                {t('moderationSuspendUser')}
              </button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
