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
  return locales.flatMap((locale) =>
    SEED_JOBS.map((j) => ({ locale, id: j.id })),
  );
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
      <main className="mx-auto w-full max-w-4xl px-6 py-22 md:px-10">
        <Link
          href={`/${locale}/jobs`}
          className="mb-4 inline-block font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
        >
          ← {t('back')}
        </Link>

        <header className="mb-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <DisciplineTag discipline={job.discipline} tone="accent" />
            <span className="font-mono text-2xs uppercase tracking-wider text-surface/50 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
              {tCity(job.city as 'RIYADH')}
            </span>
            <JobStatusBadge status={job.status} />
          </div>
          <h1 className="text-balance text-5xl md:text-6xl">{job.title}</h1>
          <p className="font-mono text-2xs uppercase tracking-wider text-surface/50 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
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
        <section className="mb-10 rounded-xl border border-surface/10 bg-surface/[0.03] p-6">
          <h2 className="mb-3 text-xl text-surface">{t('briefTitle')}</h2>
          <p className="whitespace-pre-wrap text-base text-surface/80">{job.description}</p>
        </section>

        {/* Apply / state-aware CTA */}
        {!isOwner && job.status === 'OPEN' ? (
          myApplication ? (
            <Card className="mb-10 border-sage/40 bg-sage/10">
              <CardBody className="flex flex-col gap-2 p-5">
                <Badge tone="sage" className="self-start">{t('applied')}</Badge>
                <p className="text-sm text-surface/70">{t('appliedBody')}</p>
                <p className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
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
                <Badge tone="neutral" className="self-start">{t('signInLabel')}</Badge>
                <p className="text-sm text-surface/70">{t('signInBody')}</p>
                <Link
                  href={`/${locale}/sign-in?next=/${locale}/jobs/${job.id}`}
                  className="self-start rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02]"
                >
                  {t('signInCta')}
                </Link>
              </CardBody>
            </Card>
          ) : (
            <Card className="mb-10 border-accent-secondary/40 bg-accent-secondary/5">
              <CardBody className="flex flex-col gap-2 p-5">
                <Badge tone="warning" className="self-start">{t('clientLabel')}</Badge>
                <p className="text-sm text-surface/70">{t('clientBody')}</p>
              </CardBody>
            </Card>
          )
        ) : null}

        {!isOwner && job.status !== 'OPEN' ? (
          <Card className="mb-10">
            <CardBody className="p-5">
              <Badge tone="neutral" className="self-start">{t('notOpenLabel')}</Badge>
              <p className="mt-2 text-sm text-surface/70">{t('notOpenBody')}</p>
            </CardBody>
          </Card>
        ) : null}

        {/* Owner controls */}
        {isOwner ? (
          <>
            {job.status === 'OPEN' ? (
              <Card className="mb-6 border-accent/30 bg-accent/5">
                <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Badge tone="accent" className="self-start">{t('ownerLabel')}</Badge>
                    <p className="mt-2 text-sm text-surface/70">{t('ownerBody')}</p>
                  </div>
                  <JobActions locale={locale} jobId={job.id} />
                </CardBody>
              </Card>
            ) : null}

            <section>
              <h2 className="mb-4 text-2xl text-surface">{t('applicationsTitle')}</h2>
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
    <div className="flex flex-col gap-1 rounded-md bg-surface/[0.03] p-4">
      <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
        {label}
      </span>
      <span className="font-display text-xl text-surface">{value}</span>
    </div>
  );
}
