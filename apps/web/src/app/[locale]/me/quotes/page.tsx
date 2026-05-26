import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button, Card, CardBody } from '@hikaya/ui';

import { EmptyState } from '@/components/empty-state';
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatDate, formatSarFromHalalas } from '@/lib/format';
import { listQuotesByCreator } from '@/lib/quotes/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'quotes.list' });
  return { title: t('title') };
}

export default async function MyQuotesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/quotes`);

  const creator = await getMyCreatorProfile(session.user.email);
  const t = await getTranslations('quotes.list');

  if (!creator) {
    return (
      <>
        <SiteHeader />
        <main className="py-22 mx-auto w-full max-w-3xl px-6 md:px-10">
          <Card>
            <CardBody className="flex flex-col gap-3 p-8">
              <Badge tone="warning" className="self-start">
                {t('clientLabel')}
              </Badge>
              <h1 className="text-3xl">{t('clientTitle')}</h1>
              <p className="text-surface/60">{t('clientBody')}</p>
            </CardBody>
          </Card>
        </main>
      </>
    );
  }

  const quotes = listQuotesByCreator(creator.id);

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-6xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="text-accent-secondary font-bold">{t('headlineItalic')}</span>
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        <div className="mb-8">
          <Link href={`/${locale}/me/quotes/new`}>
            <Button size="md" variant="primary">
              + {t('newCta')}
            </Button>
          </Link>
        </div>

        {quotes.length === 0 ? (
          <EmptyState
            title={t('empty')}
            subtitle={t('emptySubtitle')}
            ctaLabel={t('newCta')}
            ctaHref={`/${locale}/me/quotes/new`}
            icon={'\u{1F9FE}'}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {quotes.map((q) => (
              <li key={q.id}>
                <Link href={`/${locale}/me/quotes/${q.id}`} className="block">
                  <Card interactive>
                    <CardBody className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-2xs text-surface/40">{q.number}</span>
                        <span className="text-surface text-lg">{q.clientName}</span>
                      </div>
                      <span className="text-surface/80 text-sm font-semibold tabular-nums">
                        {formatSarFromHalalas(q.totalHalalas, locale)}
                      </span>
                      <span className="text-2xs text-surface/50">
                        {q.expiresAt
                          ? t('expires', { date: formatDate(q.expiresAt, locale) })
                          : t('noExpiry')}
                      </span>
                      <QuoteStatusBadge status={q.status} />
                    </CardBody>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
