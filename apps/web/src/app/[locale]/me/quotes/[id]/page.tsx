import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Card, CardBody } from '@hikaya/ui';

import { CopyLinkButton } from '@/components/galleries/copy-link-button';
import { DeleteQuoteButton } from '@/components/quotes/delete-quote-button';
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge';
import { QuoteSummary } from '@/components/quotes/quote-summary';
import { SendQuoteButton } from '@/components/quotes/send-quote-button';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatDateTime } from '@/lib/format';
import { getQuoteById } from '@/lib/quotes/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
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
  if (!creator) redirect(`/${locale}/me/quotes`);

  const quote = getQuoteById(id);
  if (!quote || quote.creatorId !== creator.id) notFound();

  const t = await getTranslations('quotes.detail');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const shareUrl = `${baseUrl}/${locale}/q/${quote.shareSlug}`;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-22 md:px-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/quotes`}
            className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
          >
            ← {t('back')}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <QuoteStatusBadge status={quote.status} />
            <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
              {t('updatedAt', { time: formatDateTime(quote.updatedAt, locale) })}
            </span>
          </div>
          <h1 className="text-balance text-4xl">{t('headline', { number: quote.number })}</h1>
          <p className="text-surface/60">{t('subtitle', { name: quote.clientName })}</p>
        </header>

        {/* State-specific actions */}
        {quote.status === 'DRAFT' ? (
          <Card className="mb-6 border-accent/40 bg-accent/5">
            <CardBody className="flex flex-col gap-3 p-5">
              <span className="font-mono text-2xs uppercase tracking-widest text-accent [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('draftLabel')}
              </span>
              <p className="text-sm text-surface/70">{t('draftBody')}</p>
              <div className="flex items-center gap-3">
                <SendQuoteButton locale={locale} quoteId={quote.id} />
                <DeleteQuoteButton locale={locale} quoteId={quote.id} />
              </div>
            </CardBody>
          </Card>
        ) : null}

        {quote.status === 'SENT' ? (
          <Card className="mb-6">
            <CardBody className="flex flex-col gap-3 p-5">
              <span className="font-mono text-2xs uppercase tracking-widest text-accent [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('sentLabel')}
              </span>
              <p className="text-sm text-surface/70">{t('sentBody')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <code className="flex-1 break-all rounded-md border border-surface/10 bg-surface/[0.03] px-3 py-2 font-mono text-sm text-surface">
                  {shareUrl}
                </code>
                <CopyLinkButton url={shareUrl} />
                <Link
                  href={`/${locale}/q/${quote.shareSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-surface/15 px-4 py-2 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
                >
                  {t('preview')} ↗
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {quote.status === 'APPROVED' && quote.contractId ? (
          <Card className="mb-6 border-sage/40 bg-sage/10">
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-sage [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                  {t('approvedLabel')}
                </span>
                <p className="text-sm text-surface/70">
                  {t('approvedBody', {
                    when: formatDateTime(quote.approvedAt ?? quote.updatedAt, locale),
                  })}
                </p>
              </div>
              <Link
                href={`/${locale}/me/contracts/${quote.contractId}`}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02]"
              >
                {t('viewContract')} →
              </Link>
            </CardBody>
          </Card>
        ) : null}

        {quote.status === 'REJECTED' ? (
          <Card className="mb-6 border-accent-secondary/40 bg-accent-secondary/5">
            <CardBody className="flex flex-col gap-2 p-5">
              <span className="font-mono text-2xs uppercase tracking-widest text-accent-secondary [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('rejectedLabel')}
              </span>
              {quote.rejectReason ? (
                <p className="text-sm text-surface/70">{quote.rejectReason}</p>
              ) : (
                <p className="text-sm text-surface/50">{t('rejectedNoReason')}</p>
              )}
            </CardBody>
          </Card>
        ) : null}

        <QuoteSummary quote={quote} />
      </main>
    </>
  );
}
