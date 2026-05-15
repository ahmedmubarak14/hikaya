import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Logo } from '@hikaya/ui';

import { ClientDecisionButtons } from '@/components/quotes/client-decision-buttons';
import { QuoteSummary } from '@/components/quotes/quote-summary';
import { type Locale } from '@/i18n/config';
import { getCreatorById } from '@/lib/creators/mock-store';
import { formatDateTime } from '@/lib/format';
import { getQuoteBySlug } from '@/lib/quotes/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateStaticParams() {
  const { SEED_QUOTES } = await import('@/lib/quotes/mock-data');
  const { locales } = await import('@/i18n/config');
  return locales.flatMap((locale) => SEED_QUOTES.map((q) => ({ locale, slug: q.shareSlug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const quote = getQuoteBySlug(slug);
  if (!quote) return {};
  return {
    title: `${quote.number} — ${quote.clientName}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicQuotePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const quote = getQuoteBySlug(slug);
  if (!quote) notFound();

  const creator = getCreatorById(quote.creatorId);
  const t = await getTranslations('quotes.viewer');

  const expired =
    (quote.expiresAt && new Date(quote.expiresAt) < new Date()) || quote.status === 'EXPIRED';
  const decided = quote.status === 'APPROVED' || quote.status === 'REJECTED';

  return (
    <main className="bg-bg min-h-dvh">
      <header className="border-surface/5 border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-6 md:px-10">
          <Link href={`/${locale}`} className="text-surface flex items-center" aria-label="Hikaya">
            <Logo arabic={locale === 'ar'} className="h-6" />
          </Link>
          {creator ? (
            <Link
              href={`/${locale}/${creator.username}`}
              className="border-surface/20 bg-bg/40 text-2xs text-surface/80 hover:border-surface/40 hover:text-surface flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors"
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
        <div className="mb-10 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {expired ? <Badge tone="warning">{t('expiredBadge')}</Badge> : null}
            {decided ? (
              <Badge tone={quote.status === 'APPROVED' ? 'sage' : 'warning'}>
                {t(quote.status === 'APPROVED' ? 'approvedBadge' : 'rejectedBadge')}
              </Badge>
            ) : null}
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="text-accent-secondary font-bold">{t('headlineItalic')}</span>
          </h1>
          <p className="text-surface/60 max-w-prose">
            {t('subtitle', {
              creator: creator
                ? locale === 'ar'
                  ? creator.displayNameAr
                  : creator.displayNameEn
                : '',
            })}
          </p>
        </div>

        <QuoteSummary quote={quote} />

        <section className="mt-10 flex flex-col gap-4">
          {quote.status === 'SENT' && !expired ? (
            <ClientDecisionButtons locale={locale} shareSlug={quote.shareSlug} expired={false} />
          ) : null}

          {quote.status === 'APPROVED' && quote.contractId ? (
            <div className="border-sage/40 bg-sage/10 rounded-md border p-5">
              <p className="text-surface/70 text-sm">
                {t('approvedBody', {
                  when: formatDateTime(quote.approvedAt ?? quote.updatedAt, locale),
                })}
              </p>
            </div>
          ) : null}

          {quote.status === 'REJECTED' ? (
            <div className="border-accent-secondary/40 bg-accent-secondary/5 rounded-md border p-5">
              <p className="text-surface/70 text-sm">
                {t('rejectedBody', {
                  when: formatDateTime(quote.rejectedAt ?? quote.updatedAt, locale),
                })}
              </p>
              {quote.rejectReason ? (
                <p className="text-surface/60 mt-2 text-sm">{quote.rejectReason}</p>
              ) : null}
            </div>
          ) : null}

          {expired && quote.status !== 'APPROVED' && quote.status !== 'REJECTED' ? (
            <ClientDecisionButtons locale={locale} shareSlug={quote.shareSlug} expired />
          ) : null}
        </section>
      </section>

      <footer className="border-surface/5 border-t">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-8 md:px-10">
          <Link
            href={`/${locale}`}
            className="text-surface/70 hover:text-surface flex items-center"
          >
            <Logo arabic={locale === 'ar'} className="h-5" />
          </Link>
          <p className="text-2xs text-surface/40">{t('footerNote')}</p>
        </div>
      </footer>
    </main>
  );
}
