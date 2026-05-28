import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Card, CardBody } from '@hikaya/ui';

import { CancelContractButton } from '@/components/contracts/cancel-contract-button';
import { ContractSectionsForm } from '@/components/contracts/contract-sections-form';
import { ContractStatusBadge } from '@/components/contracts/contract-status-badge';
import { SignatureAuditLog } from '@/components/contracts/signature-audit-log';
import { SignForm } from '@/components/contracts/sign-form';
import { CopyLinkButton } from '@/components/galleries/copy-link-button';
import { ReviewForm } from '@/components/reviews/review-form';
import { Stars } from '@/components/creators/reviews-section';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getContractById } from '@/lib/contracts/mock-store';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatDateTime, formatSarFromHalalas } from '@/lib/format';
import { getReviewByBookingAndAuthor } from '@/lib/reviews/mock-data';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

// Auth-gated route — generate one placeholder per locale so Next has
// when EXPORT=1, so the placeholder id is never actually used.
export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  const { listContractsByCreator } = await import('@/lib/contracts/mock-store');
  const items = listContractsByCreator('cr_noor');
  return locales.flatMap((locale) => {
    const real = items.map((item) => ({ locale, id: item.id }));
    // Always include a `_demo` placeholder so Next has a path to render
    // even when no items have been seeded for this entity.
    return real.length > 0 ? real : [{ locale, id: '_demo' }];
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const contract = getContractById(id);
  if (!contract) return {};
  const t = await getTranslations({ locale, namespace: 'contracts.detail' });
  return { title: `${t('title')} · ${contract.number}` };
}

export default async function ContractDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/contracts/${id}`);

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) redirect(`/${locale}/me/portfolio`);

  const contract = getContractById(id);
  if (!contract || contract.creatorId !== creator.id) notFound();

  const t = await getTranslations('contracts.detail');
  const tAudit = await getTranslations('contracts.audit');
  const tReviews = await getTranslations('reviews');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const shareUrl = `${baseUrl}/${locale}/c/${contract.shareSlug}`;
  const printUrl = `${baseUrl}/${locale}/c/${contract.shareSlug}/print`;

  const locked = contract.status === 'SIGNED' || contract.status === 'CANCELLED';
  const creatorSigned = Boolean(contract.creatorSignedAt);

  // Check if a review exists for this contract's associated booking
  // For demo purposes, use the contract id as a stand-in for bookingId
  const existingReview = getReviewByBookingAndAuthor(contract.id, session.user.id);
  const isCompleted = contract.status === 'SIGNED';
  const _isClient = session.user.currentRole === 'CLIENT';

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/contracts`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('back')}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <ContractStatusBadge status={contract.status} />
            <span className="text-2xs text-surface/40">
              {t('updatedAt', { time: formatDateTime(contract.updatedAt, locale) })}
            </span>
          </div>
          <h1 className="text-balance text-4xl">{t('headline', { number: contract.number })}</h1>
          <p className="text-surface/60">
            {t('subtitle', {
              client: contract.clientName,
              total: formatSarFromHalalas(contract.totalHalalas, locale),
            })}
          </p>
        </header>

        {/* Share */}
        {!locked ? (
          <Card className="mb-6">
            <CardBody className="flex flex-col gap-3 p-5">
              <span className="text-2xs text-accent-secondary">{t('shareLabel')}</span>
              <div className="flex flex-wrap items-center gap-3">
                <code className="border-surface/10 bg-surface/[0.03] text-surface flex-1 break-all rounded-md border px-3 py-2 font-mono text-sm">
                  {shareUrl}
                </code>
                <CopyLinkButton url={shareUrl} />
                <Link
                  href={`/${locale}/c/${contract.shareSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-4 py-2 text-sm transition-colors"
                >
                  {t('preview')} ↗
                </Link>
              </div>
              <p className="text-surface/50 text-xs">{t('shareHint')}</p>
            </CardBody>
          </Card>
        ) : null}

        {/* Sections (editable until signed) */}
        <section className="mb-10">
          <h2 className="text-surface mb-4 text-2xl">{t('sectionsTitle')}</h2>
          <ContractSectionsForm
            locale={locale}
            contractId={contract.id}
            sections={contract.sections}
            locked={locked}
          />
        </section>

        {/* Signatures */}
        <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Signature
            label={t('creatorSignature')}
            name={contract.creatorSignedName}
            at={contract.creatorSignedAt}
            locale={locale}
            empty={t('notSignedYet')}
          />
          <Signature
            label={t('clientSignature')}
            name={contract.clientSignedName}
            at={contract.clientSignedAt}
            locale={locale}
            empty={t('notSignedYet')}
          />
        </section>

        {/* Signature audit trail */}
        {contract.signatureAuditLog && contract.signatureAuditLog.length > 0 ? (
          <section className="mb-10">
            <SignatureAuditLog
              entries={contract.signatureAuditLog}
              locale={locale}
              title={tAudit('title')}
              creatorLabel={tAudit('creatorSigned')}
              clientLabel={tAudit('clientSigned')}
              signedAtLabel={tAudit('signedAt')}
              ipLabel={tAudit('ipAddress')}
            />
          </section>
        ) : null}

        {/* Print / download button */}
        {contract.status === 'SIGNED' ? (
          <section className="mb-10">
            <Link
              href={printUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors"
            >
              {t('printDownload')} ↗
            </Link>
          </section>
        ) : null}

        {/* Sign as creator */}
        {!locked && !creatorSigned ? (
          <section className="mb-10">
            <SignForm
              locale={locale}
              side="creator"
              contractRef={contract.id}
              defaultName={creator.displayNameEn}
            />
          </section>
        ) : null}

        {/* Cancel */}
        {!locked ? (
          <div className="border-accent-secondary/30 bg-accent-secondary/5 rounded-xl border p-5">
            <h3 className="text-surface mb-2 text-lg">{t('cancelTitle')}</h3>
            <p className="text-surface/50 mb-4 text-xs">{t('cancelHint')}</p>
            <CancelContractButton locale={locale} contractId={contract.id} />
          </div>
        ) : null}

        {contract.status === 'SIGNED' ? (
          <Card className="border-sage/40 bg-sage/10 mb-6">
            <CardBody className="p-5">
              <span className="text-2xs text-sage">{t('signedLabel')}</span>
              <p className="text-surface/70 mt-1 text-sm">{t('signedBody')}</p>
            </CardBody>
          </Card>
        ) : null}

        {/* Review section — show for completed (signed) contracts */}
        {isCompleted && !existingReview ? (
          <section className="mb-10">
            <ReviewForm
              bookingId={contract.id}
              creatorProfileId={creator.id}
              subjectUserId={session.user.id}
            />
          </section>
        ) : null}

        {isCompleted && existingReview ? (
          <section className="mb-10">
            <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
              <h3 className="text-surface mb-2 text-lg font-medium">{tReviews('existingReviewTitle')}</h3>
              <div className="mb-2 flex items-center gap-2">
                <Stars rating={existingReview.rating} size="sm" />
                <span className="text-surface/60 text-sm">{existingReview.rating} / 5</span>
              </div>
              {existingReview.body ? (
                <p className="text-surface/70 text-sm">{existingReview.body}</p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
  );
}

function Signature({
  label,
  name,
  at,
  locale,
  empty,
}: {
  label: string;
  name?: string;
  at?: string;
  locale: Locale;
  empty: string;
}) {
  return (
    <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
      <span className="text-2xs text-surface/40">{label}</span>
      {name && at ? (
        <>
          <p className="text-accent-secondary mt-2 text-2xl font-bold">{name}</p>
          <p className="text-2xs text-surface/40">{formatDateTime(at, locale)}</p>
        </>
      ) : (
        <p className="text-surface/50 mt-2 text-sm">{empty}</p>
      )}
    </div>
  );
}
