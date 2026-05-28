import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { RespondDisputeForm } from '@/components/disputes/respond-dispute-form';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getDisputeByIdAction, type DisputeStatus } from '@/lib/disputes/actions';
import { createClient } from '@/lib/supabase/server';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'disputes' });
  return { title: t('detailTitle') };
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

export default async function DisputeDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const t = await getTranslations('disputes');
  const dispute = await getDisputeByIdAction(id);

  if (!dispute) {
    return (
      <>
        <main className="py-22 mx-auto w-full max-w-2xl px-6 md:px-10">
          <p className="text-surface/60">{t('notFound')}</p>
        </main>
      </>
    );
  }

  // Determine if the current user is the creator (can respond)
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from('Booking')
    .select('creatorProfileId, CreatorProfile:CreatorProfile ( userId )')
    .eq('id', dispute.bookingId)
    .maybeSingle();

  const creatorUserId = (booking?.CreatorProfile as unknown as Record<string, unknown>)?.userId as string | undefined;
  const isCreator = session.user.id === creatorUserId;
  const isRaiser = session.user.id === dispute.raisedByUserId;
  const canRespond = isCreator && dispute.status === 'OPEN';

  const responseDueDate = new Date(dispute.responseDueAt);
  const isExpired = responseDueDate < new Date();

  return (
    <>
      <main className="py-22 mx-auto w-full max-w-2xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/disputes`}
            className="text-surface/50 hover:text-surface/70 text-sm transition-colors"
          >
            {t('backToDisputes')}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-balance text-4xl">
              {t('detailTitle')}
            </h1>
            <Badge tone={STATUS_TONE[dispute.status] ?? 'neutral'}>
              {t(`status.${dispute.status}`)}
            </Badge>
          </div>
          <p className="text-surface/50 text-sm">
            {t('disputeRef', { id: dispute.id.slice(0, 8) })}
            {' — '}
            {new Date(dispute.createdAt).toLocaleDateString()}
          </p>
        </header>

        {/* Dispute details */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardBody className="flex flex-col gap-3 p-5">
              <div>
                <span className="text-2xs text-surface/40">{t('form.reason')}</span>
                <p className="text-surface text-sm">{t(`reason.${dispute.reason}`)}</p>
              </div>
              <div>
                <span className="text-2xs text-surface/40">{t('form.description')}</span>
                <p className="text-surface whitespace-pre-wrap text-sm">{dispute.description}</p>
              </div>
              <div>
                <span className="text-2xs text-surface/40">{t('responseDue')}</span>
                <p className="text-surface text-sm">
                  {responseDueDate.toLocaleString()}
                  {isExpired && dispute.status === 'OPEN' && (
                    <Badge tone="warning" className="ml-2">{t('expired')}</Badge>
                  )}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Creator response */}
          {dispute.creatorResponse && (
            <Card>
              <CardBody className="flex flex-col gap-2 p-5">
                <span className="text-2xs text-surface/40">{t('creatorResponseLabel')}</span>
                <p className="text-surface whitespace-pre-wrap text-sm">{dispute.creatorResponse}</p>
              </CardBody>
            </Card>
          )}

          {/* Resolution */}
          {dispute.resolution && (
            <Card>
              <CardBody className="flex flex-col gap-2 p-5">
                <span className="text-2xs text-surface/40">{t('resolutionLabel')}</span>
                <p className="text-surface whitespace-pre-wrap text-sm">{dispute.resolution}</p>
              </CardBody>
            </Card>
          )}

          {/* Respond form for creator */}
          {canRespond && !isExpired && (
            <div className="mt-4">
              <RespondDisputeForm disputeId={dispute.id} locale={locale} />
            </div>
          )}

          {/* Info for raiser */}
          {isRaiser && dispute.status === 'OPEN' && (
            <Card>
              <CardBody className="p-5">
                <p className="text-surface/60 text-sm">{t('awaitingResponse')}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
