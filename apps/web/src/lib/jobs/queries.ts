import 'server-only';

import type { Job, JobApplication } from './mock-data';
import {
  getJobById as getJobByIdRaw,
  listApplicationsByApplicant as listApplicationsByApplicantRaw,
  listApplicationsByJob as listApplicationsByJobRaw,
  listJobs as listJobsRaw,
  type ListJobsFilter,
} from './mock-store';

/**
 * Server-only query helpers. When EXPORT=1 (static export), we use mock data
 * directly. Otherwise we try the real Supabase query first and fall back to
 * mock data if the result is empty (gradual migration).
 */

const isStaticExport = process.env.EXPORT === '1';

export async function listJobs(filter: ListJobsFilter = {}): Promise<Job[]> {
  if (!isStaticExport) {
    try {
      const { listJobsFromDB } = await import('./supabase-queries');
      const result = await listJobsFromDB(filter);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return listJobsRaw(filter);
}

export async function getJobById(id: string): Promise<Job | null> {
  if (!isStaticExport) {
    try {
      const { getJobByIdFromDB } = await import('./supabase-queries');
      const result = await getJobByIdFromDB(id);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getJobByIdRaw(id);
}

export async function listApplicationsForJob(jobId: string): Promise<JobApplication[]> {
  if (!isStaticExport) {
    try {
      const { listApplicationsForJobFromDB } = await import('./supabase-queries');
      const result = await listApplicationsForJobFromDB(jobId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return listApplicationsByJobRaw(jobId);
}

export async function listMyApplications(userId: string): Promise<JobApplication[]> {
  if (!isStaticExport) {
    try {
      const { listMyApplicationsFromDB } = await import('./supabase-queries');
      const result = await listMyApplicationsFromDB(userId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return listApplicationsByApplicantRaw(userId);
}
