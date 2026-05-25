import 'server-only';

import type { City, Discipline } from '@/lib/creators/mock-data';
import type { Job, JobApplication, JobApplicationStatus, JobStatus } from './mock-data';

/**
 * Real Supabase queries for jobs (Job + JobApplication).
 *
 * Each function uses the Next.js server Supabase client (cookie-based auth,
 * anon key) and returns data shaped to match the `Job` / `JobApplication`
 * types from mock-data.ts so downstream components don't need changes.
 */

async function getClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

// ---------------------------------------------------------------------------
// Mapping helpers — DB row -> front-end Job shape
// ---------------------------------------------------------------------------

interface DbJobRow {
  id: string;
  postedById: string;
  title: string;
  discipline: Discipline;
  city: City;
  description: string;
  budgetHalalas: number | null;
  budgetIsOpen: boolean;
  creatorsNeeded: number;
  deadline: string;
  status: JobStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  User?: { displayName: string; ClientProfile?: Array<{ companyName: string | null }> } | null;
}

interface DbApplicationRow {
  id: string;
  jobId: string;
  applicantUserId: string;
  creatorProfileId: string;
  coverNote: string;
  proposedRateHalalas: number;
  status: JobApplicationStatus;
  createdAt: string;
  updatedAt: string;
  CreatorProfile?: { username: string; displayNameEn: string } | null;
}

function effectiveStatus(status: JobStatus, expiresAt: string): JobStatus {
  if (status === 'OPEN' && new Date(expiresAt) < new Date()) return 'EXPIRED';
  return status;
}

function mapJob(row: DbJobRow): Job {
  return {
    id: row.id,
    postedByUserId: row.postedById,
    postedByName: row.User?.displayName ?? 'Unknown',
    postedByCompany: row.User?.ClientProfile?.[0]?.companyName ?? undefined,
    title: row.title,
    discipline: row.discipline,
    city: row.city,
    description: row.description,
    budgetHalalas: row.budgetHalalas,
    budgetIsOpen: row.budgetIsOpen,
    creatorsNeeded: row.creatorsNeeded,
    deadline: row.deadline,
    expiresAt: row.expiresAt,
    status: effectiveStatus(row.status, row.expiresAt),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapApplication(row: DbApplicationRow): JobApplication {
  return {
    id: row.id,
    jobId: row.jobId,
    applicantUserId: row.applicantUserId,
    applicantUsername: row.CreatorProfile?.username ?? '',
    applicantName: row.CreatorProfile?.displayNameEn ?? 'Unknown',
    coverNote: row.coverNote,
    proposedRateHalalas: row.proposedRateHalalas,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const JOB_SELECT = `
  id, postedById, title,
  discipline, city, description,
  budgetHalalas, budgetIsOpen, creatorsNeeded,
  deadline, status, expiresAt,
  createdAt, updatedAt,
  User ( displayName, ClientProfile ( companyName ) )
`;

const APPLICATION_SELECT = `
  id, jobId, applicantUserId, creatorProfileId,
  coverNote, proposedRateHalalas, status,
  createdAt, updatedAt,
  CreatorProfile ( username, displayNameEn )
`;

// ---------------------------------------------------------------------------
// Exported query functions
// ---------------------------------------------------------------------------

export interface ListJobsFilter {
  discipline?: Discipline;
  city?: City;
  openOnly?: boolean;
}

export async function listJobsFromDB(filter: ListJobsFilter = {}): Promise<Job[]> {
  const supabase = await getClient();

  let query = supabase.from('Job').select(JOB_SELECT);

  if (filter.discipline) {
    query = query.eq('discipline', filter.discipline);
  }
  if (filter.city) {
    query = query.eq('city', filter.city);
  }
  if (filter.openOnly) {
    query = query.eq('status', 'OPEN');
  }

  query = query.order('createdAt', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[supabase-queries] listJobsFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapJob(row as DbJobRow));
}

export async function getJobByIdFromDB(id: string): Promise<Job | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Job')
    .select(JOB_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getJobByIdFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapJob(data as unknown as DbJobRow);
}

export async function listApplicationsForJobFromDB(jobId: string): Promise<JobApplication[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('JobApplication')
    .select(APPLICATION_SELECT)
    .eq('jobId', jobId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[supabase-queries] listApplicationsForJobFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapApplication(row as DbApplicationRow));
}

export async function listMyApplicationsFromDB(userId: string): Promise<JobApplication[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('JobApplication')
    .select(APPLICATION_SELECT)
    .eq('applicantUserId', userId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[supabase-queries] listMyApplicationsFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapApplication(row as DbApplicationRow));
}
