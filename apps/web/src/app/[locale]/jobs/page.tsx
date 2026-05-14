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
      <main className="mx-auto w-full max-w-6xl px-6 py-22 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Badge tone="accent" className="self-start">{t('eyebrow')}</Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="font-bold text-accent-secondary">{t('headlineItalic')}</span>
          </h1>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
        </header>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link href={`/${locale}/jobs/new`}>
            <Button size="md" variant="primary">+ {t('newCta')}</Button>
          </Link>
          <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
            {t('count', { count: jobs.length })}
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-10 text-center">
            <p className="text-lg text-surface/70">{t('empty')}</p>
            <p className="mt-2 text-sm text-surface/40">{t('emptyHint')}</p>
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
