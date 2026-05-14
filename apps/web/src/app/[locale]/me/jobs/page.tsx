import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { JobCard } from '@/components/jobs/job-card';
import { WithdrawApplicationButton } from '@/components/jobs/withdraw-application-button';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { formatDateTime, formatSarFromHalalas } from '@/lib/format';
import {
  countApplicationsByJob,
  getJobById,
  listApplicationsByApplicant,
  listJobsByPoster,
} from '@/lib/jobs/mock-store';

import type { Metadata } from 'next';

import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { DemoModeNotice } from '@/components/demo-mode-notice';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'jobs.mine' });
  return { title: t('title') };
}

export default async function MyJobsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/jobs`);

  const t = await getTranslations('jobs.mine');
  const tStatus = await getTranslations('jobs.applicationStatus');

  const myPosts = listJobsByPoster(session.user.id);
  const myApplications = listApplicationsByApplicant(session.user.id);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-22 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-2xs text-surface/40 transition-colors hover:text-surface"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">{t('eyebrow')}</Badge>
          <h1 className="text-balance text-5xl">{t('headline')}</h1>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
        </header>

        {/* Posted */}
        <section className="mb-12">
          <header className="mb-4 flex items-baseline justify-between">
            <h2 className="text-2xl text-surface">{t('postedTitle')}</h2>
            <Link
              href={`/${locale}/jobs/new`}
              className="rounded-full border border-surface/15 px-4 py-2 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
            >
              + {t('postedCta')}
            </Link>
          </header>

          {myPosts.length === 0 ? (
            <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-8 text-center">
              <p className="text-base text-surface/70">{t('postedEmpty')}</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {myPosts.map((j) => (
                <li key={j.id}>
                  <JobCard job={j} applicationCount={countApplicationsByJob(j.id)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Applied */}
        <section>
          <h2 className="mb-4 text-2xl text-surface">{t('appliedTitle')}</h2>

          {myApplications.length === 0 ? (
            <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-8 text-center">
              <p className="text-base text-surface/70">{t('appliedEmpty')}</p>
              <p className="mt-2 text-sm text-surface/40">{t('appliedEmptyHint')}</p>
              <Link
                href={`/${locale}/jobs`}
                className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02]"
              >
                {t('appliedCta')}
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {myApplications.map((a) => {
                const job = getJobById(a.jobId);
                return (
                  <li key={a.id}>
                    <Card>
                      <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-1.5">
                          {job ? (
                            <Link
                              href={`/${locale}/jobs/${job.id}`}
                              className="text-base text-surface underline-offset-4 hover:underline"
                            >
                              {job.title}
                            </Link>
                          ) : (
                            <span className="text-base text-surface/60">{t('jobUnavailable')}</span>
                          )}
                          <span className="text-2xs text-surface/40">
                            {t('appliedAt', { when: formatDateTime(a.createdAt, locale) })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-surface/70 tabular-nums">
                            {formatSarFromHalalas(a.proposedRateHalalas, locale)}
                          </span>
                          <Badge
                            tone={
                              a.status === 'ACCEPTED'
                                ? 'sage'
                                : a.status === 'SHORTLISTED'
                                  ? 'accent'
                                  : a.status === 'REJECTED'
                                    ? 'warning'
                                    : 'neutral'
                            }
                          >
                            {tStatus(a.status as 'SUBMITTED')}
                          </Badge>
                          {a.status === 'SUBMITTED' || a.status === 'SHORTLISTED' ? (
                            <WithdrawApplicationButton locale={locale} applicationId={a.id} />
                          ) : null}
                        </div>
                      </CardBody>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
