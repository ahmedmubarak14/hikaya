import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Card, CardBody } from '@hikaya/ui';

import { CopyLinkButton } from '@/components/galleries/copy-link-button';
import { DeleteQuoteButton } from '@/components/quotes/delete-quote-button';
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge';
import { QuoteSummary } from '@/components/quotes/quote-summary';
import { SendQuoteButton } from '@/components/quotes/send-quote-button';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatDateTime } from '@/lib/format';
import { getQuoteById } from '@/lib/quotes/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

// Auth-gated route — generate one placeholder per locale so Next has
// when EXPORT=1, so the placeholder id is never actually used.
export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  const { listQuotesByCreator } = await import('@/lib/quotes/mock-store');
  const items = listQuotesByCreator('cr_noor');
  return locales.flatMap((locale) => {
    const real = items.map((item) => ({ locale, id: item.id }));
    // Always include a `_demo` placeholder so Next has a path to render
    // even when no items have been seeded for this entity.
    return real.length > 0 ? real : [{ locale, id: '_demo' }];
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const quote = getQuoteById(id);
  if (!quote) return {};
  const t = await getTranslations({ locale, namespace: 'quotes.detail' });
  return { title: `${t('title')} · ${quote.number}` };
}

export default async function QuoteDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/quotes/${id}`);

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) redirect(`/${locale}/me/portfolio`);

  const quote = getQuoteById(id);
  if (!quote || quote.creatorId !== creator.id) notFound();

  const t = await getTranslations('quotes.detail');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const shareUrl = `${baseUrl}/${locale}/q/${quote.shareSlug}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/quotes`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('back')}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <QuoteStatusBadge status={quote.status} />
            <span className="text-2xs text-surface/40">
              {t('updatedAt', { time: formatDateTime(quote.updatedAt, locale) })}
            </span>
          </div>
          <h1 className="text-balance text-4xl">{t('headline', { number: quote.number })}</h1>
          <p className="text-surface/60">{t('subtitle', { name: quote.clientName })}</p>
        </header>

        {/* State-specific actions */}
        {quote.status === 'DRAFT' ? (
          <Card className="border-accent/40 bg-accent/5 mb-6">
            <CardBody className="flex flex-col gap-3 p-5">
              <span className="text-2xs text-accent-secondary">{t('draftLabel')}</span>
              <p className="text-surface/70 text-sm">{t('draftBody')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <SendQuoteButton locale={locale} quoteId={quote.id} />
                <a
                  href={`/api/quotes/${quote.id}/pdf`}
                  className="border-line/80 text-surface hover:bg-surface/[0.04] inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                >
                  {t('downloadPdf')}
                </a>
                <DeleteQuoteButton locale={locale} quoteId={quote.id} />
              </div>
            </CardBody>
          </Card>
        ) : null}

        {quote.status === 'SENT' ? (
          <Card className="mb-6">
            <CardBody className="flex flex-col gap-3 p-5">
              <span className="text-2xs text-accent-secondary">{t('sentLabel')}</span>
              <p className="text-surface/70 text-sm">{t('sentBody')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <code className="border-surface/10 bg-surface/[0.03] text-surface flex-1 break-all rounded-md border px-3 py-2 font-mono text-sm">
                  {shareUrl}
                </code>
                <CopyLinkButton url={shareUrl} />
                <Link
                  href={`/${locale}/q/${quote.shareSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-4 py-2 text-sm transition-colors"
                >
                  {t('preview')} ↗
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {quote.status === 'APPROVED' && quote.contractId ? (
          <Card className="border-sage/40 bg-sage/10 mb-6">
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="text-2xs text-sage">{t('approvedLabel')}</span>
                <p className="text-surface/70 text-sm">
                  {t('approvedBody', {
                    when: formatDateTime(quote.approvedAt ?? quote.updatedAt, locale),
                  })}
                </p>
              </div>
              <Link
                href={`/${locale}/me/contracts/${quote.contractId}`}
                className="bg-accent text-ink rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]"
              >
                {t('viewContract')} →
              </Link>
            </CardBody>
          </Card>
        ) : null}

        {quote.status === 'REJECTED' ? (
          <Card className="border-accent-secondary/40 bg-accent-secondary/5 mb-6">
            <CardBody className="flex flex-col gap-2 p-5">
              <span className="text-2xs text-accent-secondary">{t('rejectedLabel')}</span>
              {quote.rejectReason ? (
                <p className="text-surface/70 text-sm">{quote.rejectReason}</p>
              ) : (
                <p className="text-surface/50 text-sm">{t('rejectedNoReason')}</p>
              )}
            </CardBody>
          </Card>
        ) : null}

        <QuoteSummary quote={quote} />
      </div>
  );
}
