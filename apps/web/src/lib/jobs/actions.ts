'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { createClient } from '@/lib/supabase/server';

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
  error?: undefined;
  fieldErrors?: undefined;
  message?: string;
}
export type JobResult = JobSuccess | JobFailure;

const SAR_TO_HALALAS = 100;

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
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
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: job, error } = await supabase
    .from('Job')
    .insert({
      postedById: session.user.id,
      title: parsed.data.title,
      discipline: parsed.data.discipline,
      city: parsed.data.city,
      description: parsed.data.description,
      budgetHalalas: parsed.data.budgetIsOpen ? null : (parsed.data.budgetSar ?? 0) * SAR_TO_HALALAS,
      budgetIsOpen: parsed.data.budgetIsOpen,
      creatorsNeeded: parsed.data.creatorsNeeded,
      deadline: new Date(parsed.data.deadline).toISOString(),
      status: 'OPEN',
      expiresAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
    .select('id')
    .single();

  if (error || !job) {
    console.error('[jobs/actions] postJobAction error:', error?.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/jobs`);
  revalidatePath(`/${locale}/me/jobs`);
  redirect(`/${locale}/jobs/${job.id as string}`);
}

export async function markJobFilledAction(locale: Locale, jobId: string): Promise<JobResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();

  const { data: job, error: fetchErr } = await supabase
    .from('Job')
    .select('id, postedById')
    .eq('id', jobId)
    .maybeSingle();

  if (fetchErr || !job) return { ok: false, error: 'JOB_NOT_FOUND' };
  if ((job.postedById as string) !== session.user.id) return { ok: false, error: 'NOT_OWNER' };

  const { error: updateErr } = await supabase
    .from('Job')
    .update({ status: 'FILLED', updatedAt: new Date().toISOString() })
    .eq('id', jobId);

  if (updateErr) {
    console.error('[jobs/actions] markJobFilledAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/jobs`);
  revalidatePath(`/${locale}/jobs/${jobId}`);
  revalidatePath(`/${locale}/me/jobs`);
  return { ok: true };
}

export async function closeJobAction(locale: Locale, jobId: string): Promise<JobResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();

  const { data: job, error: fetchErr } = await supabase
    .from('Job')
    .select('id, postedById')
    .eq('id', jobId)
    .maybeSingle();

  if (fetchErr || !job) return { ok: false, error: 'JOB_NOT_FOUND' };
  if ((job.postedById as string) !== session.user.id) return { ok: false, error: 'NOT_OWNER' };

  const { error: updateErr } = await supabase
    .from('Job')
    .update({ status: 'CLOSED', updatedAt: new Date().toISOString() })
    .eq('id', jobId);

  if (updateErr) {
    console.error('[jobs/actions] closeJobAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

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

  const supabase = await createClient();

  // Fetch the application to get the jobId for ownership check
  const { data: application, error: appErr } = await supabase
    .from('JobApplication')
    .select('id, jobId')
    .eq('id', applicationId)
    .maybeSingle();

  if (appErr || !application) return { ok: false, error: 'APPLICATION_NOT_FOUND' };

  // Verify the caller owns the job
  const { data: job, error: jobErr } = await supabase
    .from('Job')
    .select('id, postedById')
    .eq('id', application.jobId as string)
    .maybeSingle();

  if (jobErr || !job) return { ok: false, error: 'JOB_NOT_FOUND' };
  if ((job.postedById as string) !== session.user.id) return { ok: false, error: 'NOT_OWNER' };

  const { error: updateErr } = await supabase
    .from('JobApplication')
    .update({ status, updatedAt: new Date().toISOString() })
    .eq('id', applicationId);

  if (updateErr) {
    console.error('[jobs/actions] setApplicationStatusAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/jobs/${application.jobId as string}`);
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

  const supabase = await createClient();

  // Fetch the job to verify it's OPEN and the caller isn't the poster
  const { data: job, error: jobErr } = await supabase
    .from('Job')
    .select('id, postedById, status, expiresAt')
    .eq('id', jobId)
    .maybeSingle();

  if (jobErr || !job) return { ok: false, error: 'JOB_NOT_FOUND' };

  // Check effective status (including expiry)
  const effectiveStatus =
    (job.status as string) === 'OPEN' && new Date(job.expiresAt as string) < new Date()
      ? 'EXPIRED'
      : (job.status as string);
  if (effectiveStatus !== 'OPEN') return { ok: false, error: 'JOB_NOT_OPEN' };
  if ((job.postedById as string) === session.user.id) return { ok: false, error: 'NOT_OWNER' };

  // Check for duplicate application
  const { data: existingApp } = await supabase
    .from('JobApplication')
    .select('id')
    .eq('jobId', jobId)
    .eq('applicantUserId', session.user.id)
    .maybeSingle();

  if (existingApp) return { ok: false, error: 'ALREADY_APPLIED' };

  const parsed = applyToJobSchema.safeParse({
    coverNote: formData.get('coverNote'),
    proposedRateSar: formData.get('proposedRateSar'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const now = new Date().toISOString();
  const { error: insertErr } = await supabase.from('JobApplication').insert({
    jobId,
    applicantUserId: session.user.id,
    creatorProfileId: creator.id,
    coverNote: parsed.data.coverNote,
    proposedRateHalalas: parsed.data.proposedRateSar * SAR_TO_HALALAS,
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  });

  if (insertErr) {
    console.error('[jobs/actions] applyToJobAction error:', insertErr.message);
    // Could be a unique constraint violation (duplicate application)
    if (insertErr.code === '23505') return { ok: false, error: 'ALREADY_APPLIED' };
    return { ok: false, error: 'UNKNOWN' };
  }

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

  const supabase = await createClient();

  // Verify the caller owns this application
  const { data: application, error: fetchErr } = await supabase
    .from('JobApplication')
    .select('id, jobId, applicantUserId')
    .eq('id', applicationId)
    .eq('applicantUserId', session.user.id)
    .maybeSingle();

  if (fetchErr || !application) return { ok: false, error: 'APPLICATION_NOT_FOUND' };

  const { error: deleteErr } = await supabase
    .from('JobApplication')
    .delete()
    .eq('id', applicationId);

  if (deleteErr) {
    console.error('[jobs/actions] withdrawApplicationAction error:', deleteErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/jobs/${application.jobId as string}`);
  revalidatePath(`/${locale}/me/jobs`);
  return { ok: true };
}
