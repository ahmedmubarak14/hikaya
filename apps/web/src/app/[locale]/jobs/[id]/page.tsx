import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { DisciplineTag } from '@/components/creators/discipline-tag';
import { ApplicationsList } from '@/components/jobs/applications-list';
import { ApplyForm } from '@/components/jobs/apply-form';
import { JobActions } from '@/components/jobs/job-actions';
import { JobStatusBadge } from '@/components/jobs/job-status-badge';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { formatDate, formatDateTime, formatSarFromHalalas } from '@/lib/format';
import { findApplication, getJobById, listApplicationsByJob } from '@/lib/jobs/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

export async function generateStaticParams() {
  const { SEED_JOBS } = await import('@/lib/jobs/mock-data');
  const { locales } = await import('@/i18n/config');
  return locales.flatMap((locale) => SEED_JOBS.map((j) => ({ locale, id: j.id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const job = getJobById(id);
  if (!job) return {};
  const t = await getTranslations({ locale, namespace: 'jobs.detail' });
  return { title: `${t('title')} · ${job.title}` };
}

export default async function JobDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const job = getJobById(id);
  if (!job) notFound();

  const t = await getTranslations('jobs.detail');
  const tCity = await getTranslations('cities');

  const session = await getSession();
  const isOwner = session?.user.id === job.postedByUserId;

  // Resolve creator profile lazily so we can render the right CTA.
  const myCreator = session ? await getMyCreatorProfile(session.user.email) : null;
  const myApplication = session ? findApplication(job.id, session.user.id) : null;

  const applications = isOwner ? listApplicationsByJob(job.id) : [];

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-4xl px-6 md:px-10">
        <Link
          href={`/${locale}/jobs`}
          className="text-2xs text-surface/40 hover:text-surface mb-4 inline-block transition-colors"
        >
          ← {t('back')}
        </Link>

        <header className="mb-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <DisciplineTag discipline={job.discipline} tone="accent" />
            <span className="text-2xs text-surface/50">{tCity(job.city as 'RIYADH')}</span>
            <JobStatusBadge status={job.status} />
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {job.title}
          </h1>
          <p className="text-2xs text-surface/50">
            {t('postedBy', {
              name: job.postedByCompany ?? job.postedByName,
              when: formatDateTime(job.createdAt, locale),
            })}
          </p>
        </header>

        {/* Stats */}
        <section className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label={t('budgetLabel')}
            value={
              job.budgetIsOpen
                ? t('openToProposals')
                : job.budgetHalalas
                  ? formatSarFromHalalas(job.budgetHalalas, locale)
                  : '—'
            }
          />
          <Stat label={t('deadlineLabel')} value={formatDate(job.deadline, locale)} />
          <Stat label={t('creatorsLabel')} value={String(job.creatorsNeeded)} />
          <Stat label={t('expiresLabel')} value={formatDate(job.expiresAt, locale)} />
        </section>

        {/* Description */}
        <section className="border-surface/10 bg-surface/[0.03] mb-10 rounded-xl border p-6">
          <h2 className="text-surface mb-3 text-xl">{t('briefTitle')}</h2>
          <p className="text-surface/80 whitespace-pre-wrap text-base">{job.description}</p>
        </section>

        {/* Apply / state-aware CTA */}
        {!isOwner && job.status === 'OPEN' ? (
          myApplication ? (
            <Card className="border-sage/40 bg-sage/10 mb-10">
              <CardBody className="flex flex-col gap-2 p-5">
                <Badge tone="sage" className="self-start">
                  {t('applied')}
                </Badge>
                <p className="text-surface/70 text-sm">{t('appliedBody')}</p>
                <p className="text-2xs text-surface/40">
                  {t('appliedAt', { when: formatDateTime(myApplication.createdAt, locale) })}
                </p>
              </CardBody>
            </Card>
          ) : myCreator ? (
            <section className="mb-10">
              <ApplyForm locale={locale} jobId={job.id} />
            </section>
          ) : !session ? (
            <Card className="mb-10">
              <CardBody className="flex flex-col gap-3 p-5">
                <Badge tone="neutral" className="self-start">
                  {t('signInLabel')}
                </Badge>
                <p className="text-surface/70 text-sm">{t('signInBody')}</p>
                <Link
                  href={`/${locale}/sign-in?next=/${locale}/jobs/${job.id}`}
                  className="bg-accent text-ink self-start rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]"
                >
                  {t('signInCta')}
                </Link>
              </CardBody>
            </Card>
          ) : (
            <Card className="border-accent-secondary/40 bg-accent-secondary/5 mb-10">
              <CardBody className="flex flex-col gap-2 p-5">
                <Badge tone="warning" className="self-start">
                  {t('clientLabel')}
                </Badge>
                <p className="text-surface/70 text-sm">{t('clientBody')}</p>
              </CardBody>
            </Card>
          )
        ) : null}

        {!isOwner && job.status !== 'OPEN' ? (
          <Card className="mb-10">
            <CardBody className="p-5">
              <Badge tone="neutral" className="self-start">
                {t('notOpenLabel')}
              </Badge>
              <p className="text-surface/70 mt-2 text-sm">{t('notOpenBody')}</p>
            </CardBody>
          </Card>
        ) : null}

        {/* Owner controls */}
        {isOwner ? (
          <>
            {job.status === 'OPEN' ? (
              <Card className="border-accent/30 bg-accent/5 mb-6">
                <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Badge tone="accent" className="self-start">
                      {t('ownerLabel')}
                    </Badge>
                    <p className="text-surface/70 mt-2 text-sm">{t('ownerBody')}</p>
                  </div>
                  <JobActions locale={locale} jobId={job.id} />
                </CardBody>
              </Card>
            ) : null}

            <section>
              <h2 className="text-surface mb-4 text-2xl">{t('applicationsTitle')}</h2>
              <ApplicationsList locale={locale} applications={applications} />
            </section>
          </>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface/[0.03] flex flex-col gap-1 rounded-md p-4">
      <span className="text-2xs text-surface/40">{label}</span>
      <span className="text-surface text-xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}
