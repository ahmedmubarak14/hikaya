import 'server-only';

import { randomBytes, randomUUID } from 'node:crypto';

import {
  type Job,
  type JobApplication,
  type JobApplicationStatus,
  type JobStatus,
  SEED_APPLICATIONS,
  SEED_JOBS,
} from './mock-data';

interface Store {
  jobs: Map<string, Job>;
  applications: Map<string, JobApplication>;
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaJobsStore: Store | undefined;
}

const store: Store =
  globalThis.__hikayaJobsStore ??
  (() => {
    const fresh: Store = { jobs: new Map(), applications: new Map() };
    for (const j of SEED_JOBS) fresh.jobs.set(j.id, { ...j });
    for (const a of SEED_APPLICATIONS) fresh.applications.set(a.id, { ...a });
    return fresh;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaJobsStore = store;
}

/* --------------------------- helpers / read API --------------------------- */

function effectiveStatus(job: Job): JobStatus {
  if (job.status === 'OPEN' && new Date(job.expiresAt) < new Date()) return 'EXPIRED';
  return job.status;
}

export interface ListJobsFilter {
  discipline?: Job['discipline'];
  city?: Job['city'];
  /** When true, EXPIRED + CLOSED + FILLED jobs are excluded. */
  openOnly?: boolean;
}

export function listJobs(filter: ListJobsFilter = {}): Job[] {
  let results = [...store.jobs.values()];
  if (filter.discipline) results = results.filter((j) => j.discipline === filter.discipline);
  if (filter.city) results = results.filter((j) => j.city === filter.city);
  if (filter.openOnly) results = results.filter((j) => effectiveStatus(j) === 'OPEN');
  return results
    .map((j) => ({ ...j, status: effectiveStatus(j) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getJobById(id: string): Job | null {
  const j = store.jobs.get(id);
  if (!j) return null;
  return { ...j, status: effectiveStatus(j) };
}

export function listJobsByPoster(userId: string): Job[] {
  return [...store.jobs.values()]
    .filter((j) => j.postedByUserId === userId)
    .map((j) => ({ ...j, status: effectiveStatus(j) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listApplicationsByJob(jobId: string): JobApplication[] {
  return [...store.applications.values()]
    .filter((a) => a.jobId === jobId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listApplicationsByApplicant(userId: string): JobApplication[] {
  return [...store.applications.values()]
    .filter((a) => a.applicantUserId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function findApplication(
  jobId: string,
  applicantUserId: string,
): JobApplication | null {
  for (const a of store.applications.values()) {
    if (a.jobId === jobId && a.applicantUserId === applicantUserId) return a;
  }
  return null;
}

export function countApplicationsByJob(jobId: string): number {
  let n = 0;
  for (const a of store.applications.values()) if (a.jobId === jobId) n += 1;
  return n;
}

/* -------------------------------- write API ------------------------------- */

export interface CreateJobInput {
  postedByUserId: string;
  postedByName: string;
  postedByCompany?: string;
  title: string;
  discipline: Job['discipline'];
  city: Job['city'];
  description: string;
  budgetHalalas: number | null;
  budgetIsOpen: boolean;
  creatorsNeeded: number;
  deadline: string;
}

export function createJob(input: CreateJobInput): Job {
  const id = `job_${randomBytes(6).toString('hex')}`;
  const now = new Date();
  const job: Job = {
    id,
    postedByUserId: input.postedByUserId,
    postedByName: input.postedByName,
    postedByCompany: input.postedByCompany,
    title: input.title,
    discipline: input.discipline,
    city: input.city,
    description: input.description,
    budgetHalalas: input.budgetIsOpen ? null : input.budgetHalalas,
    budgetIsOpen: input.budgetIsOpen,
    creatorsNeeded: input.creatorsNeeded,
    deadline: input.deadline,
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'OPEN',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  store.jobs.set(id, job);
  return job;
}

export function updateJobStatus(id: string, status: JobStatus): Job {
  const existing = store.jobs.get(id);
  if (!existing) throw new Error('JOB_NOT_FOUND');
  const updated: Job = { ...existing, status, updatedAt: new Date().toISOString() };
  store.jobs.set(id, updated);
  return updated;
}

export interface CreateApplicationInput {
  jobId: string;
  applicantUserId: string;
  applicantUsername: string;
  applicantName: string;
  coverNote: string;
  proposedRateHalalas: number;
}

export function createApplication(input: CreateApplicationInput): JobApplication {
  if (findApplication(input.jobId, input.applicantUserId)) {
    throw new Error('ALREADY_APPLIED');
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  const app: JobApplication = {
    id,
    jobId: input.jobId,
    applicantUserId: input.applicantUserId,
    applicantUsername: input.applicantUsername,
    applicantName: input.applicantName,
    coverNote: input.coverNote,
    proposedRateHalalas: input.proposedRateHalalas,
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  };
  store.applications.set(id, app);
  return app;
}

export function updateApplicationStatus(
  id: string,
  status: JobApplicationStatus,
): JobApplication {
  const existing = store.applications.get(id);
  if (!existing) throw new Error('APPLICATION_NOT_FOUND');
  const updated: JobApplication = { ...existing, status, updatedAt: new Date().toISOString() };
  store.applications.set(id, updated);
  return updated;
}

export function withdrawApplication(id: string): void {
  store.applications.delete(id);
}
