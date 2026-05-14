import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Logo } from '@hikaya/ui';

import { ContractStatusBadge } from '@/components/contracts/contract-status-badge';
import { SignForm } from '@/components/contracts/sign-form';
import { type Locale } from '@/i18n/config';
import { getContractBySlug } from '@/lib/contracts/mock-store';
import { getCreatorById } from '@/lib/creators/mock-store';
import { formatDateTime, formatSarFromHalalas } from '@/lib/format';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; slug: string }>;
}

// No contracts exist at build time (they're born from approved quotes).
// Generate one placeholder per locale so Next has something to render; the
// page calls notFound() when the slug doesn't resolve, which produces the
// standard 404 — correct, since signing requires the live app.
export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  return locales.map((locale) => ({ locale, slug: '_demo' }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const contract = getContractBySlug(slug);
  if (!contract) return {};
  return {
    title: `${contract.number} — ${contract.clientName}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicContractPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const contract = getContractBySlug(slug);
  if (!contract) notFound();

  const creator = getCreatorById(contract.creatorId);
  const t = await getTranslations('contracts.viewer');
  const tSection = await getTranslations('contracts.sections');

  const clientSigned = Boolean(contract.clientSignedAt);
  const cancelled = contract.status === 'CANCELLED';
  const signed = contract.status === 'SIGNED';

  return (
    <main className="min-h-dvh bg-bg">
      <header className="border-b border-surface/5">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-6 md:px-10">
          <Link href={`/${locale}`} className="flex items-center text-surface" aria-label="Hikaya">
            <Logo arabic={locale === 'ar'} className="h-6" />
          </Link>
          {creator ? (
            <Link
              href={`/${locale}/${creator.username}`}
              className="flex items-center gap-2 rounded-full border border-surface/20 bg-bg/40 px-3 py-1.5 text-2xs text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
            >
              <span className="relative h-5 w-5 overflow-hidden rounded-full">
                <Image src={creator.avatarUrl} alt="" fill sizes="20px" className="object-cover" />
              </span>
              <span>{locale === 'ar' ? creator.displayNameAr : creator.displayNameEn}</span>
            </Link>
          ) : null}
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10">
        <div className="mb-8 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ContractStatusBadge status={contract.status} />
            <span className="text-2xs text-surface/40">
              {contract.number}
            </span>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="font-bold text-accent-secondary">{t('headlineItalic')}</span>
          </h1>
          <p className="max-w-prose text-surface/60">
            {t('subtitle', {
              creator: creator ? (locale === 'ar' ? creator.displayNameAr : creator.displayNameEn) : '',
              total: formatSarFromHalalas(contract.totalHalalas, locale),
            })}
          </p>
        </div>

        {cancelled ? (
          <Badge tone="warning">{t('cancelled')}</Badge>
        ) : null}

        {/* Sections */}
        <article className="mt-8 flex flex-col gap-6">
          {contract.sections.map((s) => (
            <section
              key={s.key}
              className="rounded-xl border border-surface/10 bg-surface/[0.03] p-5"
            >
              <h2 className="mb-2 text-lg text-surface">
                {tSection(`${s.key}.title` as 'scopeOfWork.title')}
              </h2>
              <p className="whitespace-pre-wrap text-sm text-surface/80">{s.body}</p>
            </section>
          ))}
        </article>

        {/* Signatures shown inline */}
        <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SigBlock
            label={t('creatorSignature')}
            name={contract.creatorSignedName}
            at={contract.creatorSignedAt}
            locale={locale}
            empty={t('awaitingCreator')}
          />
          <SigBlock
            label={t('clientSignature')}
            name={contract.clientSignedName}
            at={contract.clientSignedAt}
            locale={locale}
            empty={t('awaitingClient')}
          />
        </section>

        {/* Sign as client */}
        {!cancelled && !signed && !clientSigned ? (
          <section className="mt-10">
            <SignForm
              locale={locale}
              side="client"
              contractRef={contract.shareSlug}
              defaultName={contract.clientName}
            />
          </section>
        ) : null}

        {signed ? (
          <section className="mt-10 rounded-xl border border-sage/40 bg-sage/10 p-6">
            <span className="text-2xs text-sage">
              {t('lockedLabel')}
            </span>
            <p className="mt-2 text-sm text-surface/70">{t('lockedBody')}</p>
          </section>
        ) : null}
      </section>

      <footer className="border-t border-surface/5">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-8 md:px-10">
          <Link href={`/${locale}`} className="flex items-center text-surface/70 hover:text-surface">
            <Logo arabic={locale === 'ar'} className="h-5" />
          </Link>
          <p className="text-2xs text-surface/40">
            {t('footerNote')}
          </p>
        </div>
      </footer>
    </main>
  );
}

function SigBlock({
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
      <span className="text-2xs text-surface/40">
        {label}
      </span>
      {name && at ? (
        <>
          <p className="mt-2 text-2xl font-bold text-accent-secondary">{name}</p>
          <p className="text-2xs text-surface/40">
            {formatDateTime(at, locale)}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-surface/50">{empty}</p>
      )}
    </div>
  );
}
