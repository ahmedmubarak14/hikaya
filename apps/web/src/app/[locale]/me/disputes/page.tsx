import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyDisputesAction, type DisputeStatus } from '@/lib/disputes/actions';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'disputes' });
  return { title: t('title') };
}

const STATUS_TONE: Record<DisputeStatus, 'neutral' | 'accent' | 'warning'> = {
  OPEN: 'warning',
  CREATOR_RESPONDED: 'accent',
  UNDER_REVIEW: 'neutral',
  RESOLVED_CREATOR: 'accent',
  RESOLVED_CLIENT_PARTIAL: 'accent',
  RESOLVED_CLIENT_FULL: 'accent',
  APPEALED: 'warning',
};

export default async function DisputesListPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const t = await getTranslations('disputes');
  const disputes = await getMyDisputesAction();

  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-surface/50 hover:text-surface/70 text-sm transition-colors"
          >
            {t('backToAccount')}
          </Link>
          <h1 className="text-balance text-5xl">{t('title')}</h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        <div className="mb-6">
          <Link
            href={`/${locale}/me/disputes/new`}
            className="border-accent/40 bg-accent/10 text-accent-secondary hover:bg-accent/15 inline-block rounded-full border px-5 py-2 text-sm transition-colors"
          >
            {t('newCta')}
          </Link>
        </div>

        {disputes.length === 0 ? (
          <Card>
            <CardBody className="p-6 text-center">
              <p className="text-surface/60">{t('empty')}</p>
              <p className="text-surface/40 mt-1 text-sm">{t('emptyHint')}</p>
            </CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {disputes.map((d) => (
              <Link key={d.id} href={`/${locale}/me/disputes/${d.id}`}>
                <Card>
                  <CardBody className="flex items-center justify-between gap-4 p-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-surface text-sm font-medium">
                        {t('disputeRef', { id: d.id.slice(0, 8) })}
                      </span>
                      <span className="text-surface/50 text-xs">
                        {t('reason.' + d.reason)}
                        {' — '}
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge tone={STATUS_TONE[d.status] ?? 'neutral'}>
                      {t(`status.${d.status}`)}
                    </Badge>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
  );
}
