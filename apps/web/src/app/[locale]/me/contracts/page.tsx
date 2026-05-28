import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { ContractStatusBadge } from '@/components/contracts/contract-status-badge';
import { EmptyState } from '@/components/empty-state';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { listContractsByCreator } from '@/lib/contracts/mock-store';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatDateTime, formatSarFromHalalas } from '@/lib/format';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contracts.list' });
  return { title: t('title') };
}

export default async function MyContractsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/contracts`);

  const creator = await getMyCreatorProfile(session.user.email);
  const t = await getTranslations('contracts.list');

  if (!creator) {
    return (
      <>
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

  const contracts = listContractsByCreator(creator.id);

  return (
    <>
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

        {contracts.length === 0 ? (
          <EmptyState
            title={t('empty')}
            subtitle={t('emptySubtitle')}
            ctaLabel={t('newQuoteCta')}
            ctaHref={`/${locale}/me/quotes/new`}
            icon={'\u{1F4C4}'}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {contracts.map((c) => (
              <li key={c.id}>
                <Link href={`/${locale}/me/contracts/${c.id}`} className="block">
                  <Card interactive>
                    <CardBody className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-2xs text-surface/40">{c.number}</span>
                        <span className="text-surface text-lg">{c.clientName}</span>
                      </div>
                      <span className="text-surface/70 font-mono text-sm tabular-nums">
                        {formatSarFromHalalas(c.totalHalalas, locale)}
                      </span>
                      <span className="text-2xs text-surface/50">
                        {t('updatedAt', { time: formatDateTime(c.updatedAt, locale) })}
                      </span>
                      <ContractStatusBadge status={c.status} />
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
