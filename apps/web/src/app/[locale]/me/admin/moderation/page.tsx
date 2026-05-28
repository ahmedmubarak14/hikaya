import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { ResolveReportButtons } from '@/components/admin/resolve-report-buttons';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: t('moderationTitle') };
}

export default async function ModerationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  // Check admin
  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from('User')
    .select('roles')
    .eq('id', session.user.id)
    .maybeSingle();

  const dbRoles = (userRow?.roles ?? []) as string[];
  const sessionRoles = session.user.roles as string[];
  const allRoles = [...new Set([...dbRoles, ...sessionRoles])];
  const isAdmin = allRoles.includes('ADMIN');

  const t = await getTranslations('admin');

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-4xl px-8 py-10">
          <h1 className="text-3xl">{t('accessDenied')}</h1>
          <p className="text-surface/60 mt-2">{t('accessDeniedBody')}</p>
        </div>
    );
  }

  const { data: reports } = await supabase
    .from('Report')
    .select('id, reporterId, targetUserId, targetKind, targetRef, reasonKind, reasonNote, status, createdAt')
    .eq('status', 'OPEN')
    .order('createdAt', { ascending: false })
    .limit(50);

  type ReportRow = {
    id: string;
    reporterId: string;
    targetUserId: string | null;
    targetKind: string;
    targetRef: string | null;
    reasonKind: string;
    reasonNote: string | null;
    createdAt: string;
  };

  const rows = ((reports as ReportRow[] | null) ?? []);

  // Resolve display names for reporters + targets in a single round-trip.
  const ids = new Set<string>();
  for (const r of rows) {
    ids.add(r.reporterId);
    if (r.targetUserId) ids.add(r.targetUserId);
  }
  let nameById = new Map<string, string>();
  if (ids.size > 0) {
    const { data: users } = await supabase
      .from('User')
      .select('id, displayName')
      .in('id', [...ids]);
    nameById = new Map((users ?? []).map((u) => [u.id as string, u.displayName as string]));
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-10">
      <header className="mb-10 flex flex-col gap-3">
        <Link
          href={`/${locale}/me/admin`}
          className="text-surface/50 hover:text-surface/70 text-sm transition-colors"
        >
          {t('backToAdmin')}
        </Link>
        <Badge tone="accent" className="self-start">
          {t('moderationEyebrow')}
        </Badge>
        <h1 className="text-balance text-5xl">{t('moderationTitle')}</h1>
        <p className="text-surface/60 max-w-prose">{t('moderationSubtitle')}</p>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-surface/60 text-lg">{t('moderationEmpty')}</p>
            <p className="text-surface/40 mt-2 text-sm">{t('moderationEmptyHint')}</p>
          </CardBody>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <CardBody className="flex flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="warning">{r.reasonKind}</Badge>
                      <Badge tone="neutral">{r.targetKind}</Badge>
                    </div>
                    <span className="text-surface/40 text-2xs font-mono tabular-nums">
                      {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }).format(new Date(r.createdAt))}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                    <p className="text-surface/70">
                      <span className="text-surface/40">{t('reporterLabel')}:</span>{' '}
                      {nameById.get(r.reporterId) ?? r.reporterId}
                    </p>
                    <p className="text-surface/70">
                      <span className="text-surface/40">{t('targetLabel')}:</span>{' '}
                      {r.targetUserId
                        ? (nameById.get(r.targetUserId) ?? r.targetUserId)
                        : (r.targetRef ?? '—')}
                    </p>
                  </div>
                  {r.reasonNote ? (
                    <p className="text-surface/80 border-surface/10 rounded-md border bg-bg/40 p-3 text-xs">
                      {r.reasonNote}
                    </p>
                  ) : null}
                  <ResolveReportButtons reportId={r.id} />
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
