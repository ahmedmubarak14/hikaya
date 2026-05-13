import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button, Card, CardBody } from '@hikaya/ui';

import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatDate, formatSarFromHalalas } from '@/lib/format';
import { listQuotesByCreator } from '@/lib/quotes/mock-store';

import type { Metadata } from 'next';

import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { DemoModeNotice } from '@/components/demo-mode-notice';

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
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/quotes`);

  const creator = await getMyCreatorProfile(session.user.email);
  const t = await getTranslations('quotes.list');

  if (!creator) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl px-6 py-22 md:px-10">
          <Card>
            <CardBody className="flex flex-col gap-3 p-8">
              <Badge tone="warning" className="self-start">{t('clientLabel')}</Badge>
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
      <main className="mx-auto w-full max-w-6xl px-6 py-22 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">{t('eyebrow')}</Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="font-bold text-accent-secondary">{t('headlineItalic')}</span>
          </h1>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
        </header>

        <div className="mb-8">
          <Link href={`/${locale}/me/quotes/new`}>
            <Button size="md" variant="primary">+ {t('newCta')}</Button>
          </Link>
        </div>

        {quotes.length === 0 ? (
          <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-10 text-center">
            <p className="text-lg text-surface/70">{t('empty')}</p>
            <p className="mt-2 text-sm text-surface/40">{t('emptyHint')}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {quotes.map((q) => (
              <li key={q.id}>
                <Link href={`/${locale}/me/quotes/${q.id}`} className="block">
                  <Card interactive>
                    <CardBody className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                          {q.number}
                        </span>
                        <span className="text-lg text-surface">{q.clientName}</span>
                      </div>
                      <span className="font-mono text-sm text-surface/70 tabular-nums">
                        {formatSarFromHalalas(q.totalHalalas, locale)}
                      </span>
                      <span className="font-mono text-2xs uppercase tracking-widest text-surface/50 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                        {q.expiresAt ? t('expires', { date: formatDate(q.expiresAt, locale) }) : t('noExpiry')}
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
