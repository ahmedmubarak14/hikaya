import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Card, CardBody } from '@hikaya/ui';

import { CancelContractButton } from '@/components/contracts/cancel-contract-button';
import { ContractSectionsForm } from '@/components/contracts/contract-sections-form';
import { ContractStatusBadge } from '@/components/contracts/contract-status-badge';
import { SignForm } from '@/components/contracts/sign-form';
import { CopyLinkButton } from '@/components/galleries/copy-link-button';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getContractById } from '@/lib/contracts/mock-store';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatDateTime, formatSarFromHalalas } from '@/lib/format';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
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
  if (!creator) redirect(`/${locale}/me/contracts`);

  const contract = getContractById(id);
  if (!contract || contract.creatorId !== creator.id) notFound();

  const t = await getTranslations('contracts.detail');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const shareUrl = `${baseUrl}/${locale}/c/${contract.shareSlug}`;

  const locked = contract.status === 'SIGNED' || contract.status === 'CANCELLED';
  const creatorSigned = Boolean(contract.creatorSignedAt);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-22 md:px-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/contracts`}
            className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
          >
            ← {t('back')}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <ContractStatusBadge status={contract.status} />
            <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
              {t('updatedAt', { time: formatDateTime(contract.updatedAt, locale) })}
            </span>
          </div>
          <h1 className="text-balance text-4xl">
            {t('headline', { number: contract.number })}
          </h1>
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
              <span className="font-mono text-2xs uppercase tracking-widest text-accent [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('shareLabel')}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <code className="flex-1 break-all rounded-md border border-surface/10 bg-surface/[0.03] px-3 py-2 font-mono text-sm text-surface">
                  {shareUrl}
                </code>
                <CopyLinkButton url={shareUrl} />
                <Link
                  href={`/${locale}/c/${contract.shareSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-surface/15 px-4 py-2 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
                >
                  {t('preview')} ↗
                </Link>
              </div>
              <p className="text-xs text-surface/50">{t('shareHint')}</p>
            </CardBody>
          </Card>
        ) : null}

        {/* Sections (editable until signed) */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl text-surface">{t('sectionsTitle')}</h2>
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
          <div className="rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 p-5">
            <h3 className="mb-2 text-lg text-surface">{t('cancelTitle')}</h3>
            <p className="mb-4 text-xs text-surface/50">{t('cancelHint')}</p>
            <CancelContractButton locale={locale} contractId={contract.id} />
          </div>
        ) : null}

        {contract.status === 'SIGNED' ? (
          <Card className="border-sage/40 bg-sage/10">
            <CardBody className="p-5">
              <span className="font-mono text-2xs uppercase tracking-widest text-sage [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('signedLabel')}
              </span>
              <p className="mt-1 text-sm text-surface/70">{t('signedBody')}</p>
            </CardBody>
          </Card>
        ) : null}
      </main>
    </>
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
    <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-5">
      <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
        {label}
      </span>
      {name && at ? (
        <>
          <p className="mt-2 font-display text-2xl italic text-accent">{name}</p>
          <p className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
            {formatDateTime(at, locale)}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-surface/50">{empty}</p>
      )}
    </div>
  );
}
