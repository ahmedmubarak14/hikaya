import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { type Locale } from '@/i18n/config';
import { getContractBySlug } from '@/lib/contracts/mock-store';
import { getCreatorById } from '@/lib/creators/mock-store';
import { formatDateTime, formatSarFromHalalas } from '@/lib/format';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  return locales.map((locale) => ({ locale, slug: '_demo' }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const contract = getContractBySlug(slug);
  if (!contract) return {};
  return {
    title: `${contract.number} — Print`,
    robots: { index: false, follow: false },
  };
}

export default async function ContractPrintPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const contract = getContractBySlug(slug);
  if (!contract) notFound();

  const creator = getCreatorById(contract.creatorId);
  const t = await getTranslations('contracts.viewer');
  const tSection = await getTranslations('contracts.sections');
  const tAudit = await getTranslations('contracts.audit');

  return (
    <main className="print-page mx-auto max-w-3xl px-8 py-10">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { background: white !important; color: black !important; }
              .print-page { max-width: 100% !important; padding: 0 !important; }
              .no-print { display: none !important; }
              h1, h2, h3 { color: black !important; }
              p, span, dd, dt { color: #333 !important; }
              .print-section { break-inside: avoid; page-break-inside: avoid; }
              .print-border { border-color: #ccc !important; }
            }
            @media screen {
              .print-page { font-family: system-ui, sans-serif; }
            }
          `,
        }}
      />

      {/* Print instructions (hidden when printing) */}
      <div className="no-print bg-accent/10 border-accent/30 mb-8 rounded-lg border p-4">
        <p className="text-surface text-sm">
          {t('printInstructions' as 'headline')}
        </p>
        <p className="text-surface/60 mt-1 text-xs">
          Press Cmd+P (Mac) or Ctrl+P (Windows) to save as PDF.
        </p>
      </div>

      {/* Header */}
      <header className="mb-8 border-b pb-6 print-border">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Hikaya</h1>
          <span className="text-sm text-gray-500">{contract.number}</span>
        </div>
        <h2 className="mb-1 text-xl font-semibold">
          {t('headline')} {t('headlineItalic')}
        </h2>
        {creator ? (
          <p className="text-sm text-gray-600">
            {t('subtitle', {
              creator:
                locale === 'ar'
                  ? creator.displayNameAr
                  : creator.displayNameEn,
              total: formatSarFromHalalas(contract.totalHalalas, locale),
            })}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-gray-400">
          Status: {contract.status}
        </p>
      </header>

      {/* Sections */}
      <div className="mb-8 flex flex-col gap-5">
        {(contract.sections ?? []).map((s) => (
          <section key={s.key} className="print-section">
            <h3 className="mb-1 text-base font-semibold">
              {tSection(`${s.key}.title` as 'scopeOfWork.title')}
            </h3>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{s.body}</p>
          </section>
        ))}
      </div>

      {/* Signatures */}
      <section className="print-section mb-8 grid grid-cols-2 gap-6 border-t pt-6 print-border">
        <div>
          <span className="text-xs text-gray-400">{t('creatorSignature')}</span>
          {contract.creatorSignedName && contract.creatorSignedAt ? (
            <>
              <p className="mt-1 text-lg font-bold">{contract.creatorSignedName}</p>
              <p className="text-xs text-gray-500">
                {formatDateTime(contract.creatorSignedAt, locale)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-gray-400">{t('awaitingCreator')}</p>
          )}
        </div>
        <div>
          <span className="text-xs text-gray-400">{t('clientSignature')}</span>
          {contract.clientSignedName && contract.clientSignedAt ? (
            <>
              <p className="mt-1 text-lg font-bold">{contract.clientSignedName}</p>
              <p className="text-xs text-gray-500">
                {formatDateTime(contract.clientSignedAt, locale)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-gray-400">{t('awaitingClient')}</p>
          )}
        </div>
      </section>

      {/* Audit trail */}
      {contract.signatureAuditLog && contract.signatureAuditLog.length > 0 ? (
        <section className="print-section border-t pt-6 print-border">
          <h3 className="mb-3 text-base font-semibold">{tAudit('title')}</h3>
          <ul className="flex flex-col gap-2">
            {contract.signatureAuditLog.map((entry, i) => (
              <li key={i} className="text-xs text-gray-600">
                <span className="font-medium">
                  {entry.side === 'creator' ? tAudit('creatorSigned') : tAudit('clientSigned')}
                </span>
                {' — '}
                {entry.name}
                {' — '}
                {tAudit('signedAt')} {formatDateTime(entry.signedAt, locale)}
                {' — '}
                {tAudit('ipAddress')} {entry.ip}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Footer */}
      <footer className="mt-10 border-t pt-4 text-center text-xs text-gray-400 print-border">
        <p>{t('footerNote')}</p>
      </footer>
    </main>
  );
}
