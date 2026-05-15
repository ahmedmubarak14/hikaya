import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button } from '@hikaya/ui';

import { JobCard } from '@/components/jobs/job-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { listJobs } from '@/lib/jobs/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'jobs.list' });
  return { title: t('title') };
}

export default async function JobsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('jobs.list');
  const jobs = listJobs({ openOnly: true });

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-6xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="text-accent-secondary font-bold">{t('headlineItalic')}</span>
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link href={`/${locale}/jobs/new`}>
            <Button size="md" variant="primary">
              + {t('newCta')}
            </Button>
          </Link>
          <span className="text-2xs text-surface/40">{t('count', { count: jobs.length })}</span>
        </div>

        {jobs.length === 0 ? (
          <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
            <p className="text-surface/70 text-lg">{t('empty')}</p>
            <p className="text-surface/40 mt-2 text-sm">{t('emptyHint')}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
