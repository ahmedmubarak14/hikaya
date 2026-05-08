'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';

import {
  createApplication,
  createJob,
  findApplication,
  getJobById,
  listApplicationsByApplicant,
  updateApplicationStatus,
  updateJobStatus,
  withdrawApplication as storeWithdraw,
} from './mock-store';
import { applyToJobSchema, postJobSchema } from './schemas';

export type JobErrorKey =
  | 'INVALID_INPUT'
  | 'NOT_AUTHENTICATED'
  | 'JOB_NOT_FOUND'
  | 'NOT_OWNER'
  | 'NOT_CREATOR'
  | 'ALREADY_APPLIED'
  | 'JOB_NOT_OPEN'
  | 'WRONG_STATE'
  | 'APPLICATION_NOT_FOUND'
  | 'UNKNOWN';

export interface JobFailure {
  ok: false;
  error: JobErrorKey;
  fieldErrors?: Record<string, string>;
}
export interface JobSuccess {
  ok: true;
  message?: string;
}
export type JobResult = JobSuccess | JobFailure;

const SAR_TO_HALALAS = 100;

function fieldErrorsFromZod(issues: { path: (string | number)[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/* ---------------------------- client-side actions -------------------------- */

export async function postJobAction(
  locale: Locale,
  _prev: JobResult | null,
  formData: FormData,
): Promise<JobResult> {
  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/jobs/new`);

  const parsed = postJobSchema.safeParse({
    title: formData.get('title'),
    discipline: formData.get('discipline'),
    city: formData.get('city'),
    description: formData.get('description'),
    budgetIsOpen: formData.get('budgetIsOpen') === 'on',
    budgetSar: formData.get('budgetSar') || undefined,
    creatorsNeeded: formData.get('creatorsNeeded') || '1',
    deadline: formData.get('deadline'),
    postedByCompany: formData.get('postedByCompany') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const job = createJob({
    postedByUserId: session.user.id,
    postedByName: session.user.displayName,
    postedByCompany: parsed.data.postedByCompany || undefined,
    title: parsed.data.title,
    discipline: parsed.data.discipline,
    city: parsed.data.city,
    description: parsed.data.description,
    budgetHalalas: parsed.data.budgetIsOpen ? null : (parsed.data.budgetSar ?? 0) * SAR_TO_HALALAS,
    budgetIsOpen: parsed.data.budgetIsOpen,
    creatorsNeeded: parsed.data.creatorsNeeded,
    deadline: new Date(parsed.data.deadline).toISOString(),
  });

  revalidatePath(`/${locale}/jobs`);
  revalidatePath(`/${locale}/me/jobs`);
  redirect(`/${locale}/jobs/${job.id}`);
}

export async function markJobFilledAction(locale: Locale, jobId: string): Promise<JobResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const job = getJobById(jobId);
  if (!job) return { ok: false, error: 'JOB_NOT_FOUND' };
  if (job.postedByUserId !== session.user.id) return { ok: false, error: 'NOT_OWNER' };

  updateJobStatus(jobId, 'FILLED');
  revalidatePath(`/${locale}/jobs`);
  revalidatePath(`/${locale}/jobs/${jobId}`);
  revalidatePath(`/${locale}/me/jobs`);
  return { ok: true };
}

export async function closeJobAction(locale: Locale, jobId: string): Promise<JobResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const job = getJobById(jobId);
  if (!job) return { ok: false, error: 'JOB_NOT_FOUND' };
  if (job.postedByUserId !== session.user.id) return { ok: false, error: 'NOT_OWNER' };

  updateJobStatus(jobId, 'CLOSED');
  revalidatePath(`/${locale}/jobs`);
  revalidatePath(`/${locale}/jobs/${jobId}`);
  revalidatePath(`/${locale}/me/jobs`);
  return { ok: true };
}

export async function setApplicationStatusAction(
  locale: Locale,
  applicationId: string,
  status: 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED',
): Promise<JobResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  // Ownership check happens by reading the job via the application's jobId.
  const updated = updateApplicationStatus(applicationId, status);
  const job = getJobById(updated.jobId);
  if (!job) return { ok: false, error: 'JOB_NOT_FOUND' };
  if (job.postedByUserId !== session.user.id) {
    // Roll back if not owner — shouldn't happen via our UI, but guard anyway.
    updateApplicationStatus(applicationId, 'SUBMITTED');
    return { ok: false, error: 'NOT_OWNER' };
  }

  revalidatePath(`/${locale}/jobs/${job.id}`);
  revalidatePath(`/${locale}/me/jobs`);
  return { ok: true };
}

/* --------------------------- creator-side actions ------------------------- */

export async function applyToJobAction(
  locale: Locale,
  jobId: string,
  _prev: JobResult | null,
  formData: FormData,
): Promise<JobResult> {
  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/jobs/${jobId}`);

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) return { ok: false, error: 'NOT_CREATOR' };

  const job = getJobById(jobId);
  if (!job) return { ok: false, error: 'JOB_NOT_FOUND' };
  if (job.status !== 'OPEN') return { ok: false, error: 'JOB_NOT_OPEN' };
  if (job.postedByUserId === session.user.id) return { ok: false, error: 'NOT_OWNER' };

  if (findApplication(jobId, session.user.id)) {
    return { ok: false, error: 'ALREADY_APPLIED' };
  }

  const parsed = applyToJobSchema.safeParse({
    coverNote: formData.get('coverNote'),
    proposedRateSar: formData.get('proposedRateSar'),
  });
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  createApplication({
    jobId,
    applicantUserId: session.user.id,
    applicantUsername: creator.username,
    applicantName: locale === 'ar' ? creator.displayNameAr : creator.displayNameEn,
    coverNote: parsed.data.coverNote,
    proposedRateHalalas: parsed.data.proposedRateSar * SAR_TO_HALALAS,
  });

  revalidatePath(`/${locale}/jobs/${jobId}`);
  revalidatePath(`/${locale}/me/jobs`);
  return { ok: true, message: 'APPLIED' };
}

export async function withdrawApplicationAction(
  locale: Locale,
  applicationId: string,
): Promise<JobResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  // Ownership check: confirm the caller authored the application.
  const target = listApplicationsByApplicant(session.user.id).find((a) => a.id === applicationId);
  if (!target) return { ok: false, error: 'APPLICATION_NOT_FOUND' };

  storeWithdraw(applicationId);
  revalidatePath(`/${locale}/jobs/${target.jobId}`);
  revalidatePath(`/${locale}/me/jobs`);
  return { ok: true };
}
