/**
 * Job + JobApplication shapes — mirror the Prisma `Job`,
 * `JobApplication`, `JobStatus`, and `JobApplicationStatus` models.
 *
 * Per the PRD: posts auto-expire after 30 days; one application per
 * (jobId, applicantUserId); client marks "Filled" to remove from board.
 */

import type { City, Discipline } from '@/lib/creators/mock-data';

export type JobStatus = 'OPEN' | 'FILLED' | 'EXPIRED' | 'CLOSED';

export type JobApplicationStatus = 'SUBMITTED' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED';

export interface Job {
  id: string;
  /** mock-auth user id of the poster (typically a CLIENT). */
  postedByUserId: string;
  /** Display name of the poster, for cards and detail. */
  postedByName: string;
  /** Optional company / business name. */
  postedByCompany?: string;
  title: string;
  discipline: Discipline;
  city: City;
  description: string;
  /** Halalas. null when budgetIsOpen is true. */
  budgetHalalas: number | null;
  budgetIsOpen: boolean;
  creatorsNeeded: number;
  deadline: string; // ISO — when the work should happen / be delivered
  expiresAt: string; // ISO — auto-set to 30 days from posting
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  /** mock-auth user id of the applicant (must own a creator profile). */
  applicantUserId: string;
  /** Slug of the applicant's creator profile, for deep-linking. */
  applicantUsername: string;
  applicantName: string;
  coverNote: string;
  proposedRateHalalas: number;
  status: JobApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

/* --------------------------------- seed ---------------------------------- */

const now = new Date();
const inDays = (d: number): string => {
  const date = new Date(now);
  date.setDate(date.getDate() + d);
  return date.toISOString();
};
const daysAgo = (d: number): string => inDays(-d);

/**
 * Seed jobs are posted by a stable synthetic user id ("u_seed_brand"). They
 * are visible to everyone; only that synthetic user can edit them — which
 * means the seeded jobs are immutable from the demo's perspective. That's
 * intentional: applicants can experience the apply flow without anyone in
 * the demo accidentally mutating posted jobs.
 */
export const SEED_POSTER_ID = 'u_seed_brand';

export const SEED_JOBS: Job[] = [
  {
    id: 'job_seed_001',
    postedByUserId: SEED_POSTER_ID,
    postedByName: 'Lina Saqr',
    postedByCompany: 'Al-Asalah Studio',
    title: 'Brand campaign — modest fashion editorial',
    discipline: 'FASHION_PHOTOGRAPHY',
    city: 'RIYADH',
    description:
      'We\'re launching the AW collection in early March and need a photographer for a one-day editorial shoot. Indoor location confirmed (Diriyah). Looking for warm, soft-light energy with strong portrait fundamentals. Hair + makeup provided. Final delivery: 35–50 retouched images within 10 days.',
    budgetHalalas: 4_500_000, // 45,000 SAR
    budgetIsOpen: false,
    creatorsNeeded: 1,
    deadline: inDays(21),
    expiresAt: inDays(28),
    status: 'OPEN',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'job_seed_002',
    postedByUserId: SEED_POSTER_ID,
    postedByName: 'Faisal Al-Mutlaq',
    postedByCompany: 'Mutlaq Realty',
    title: 'Drone + commercial video for new development reveal',
    discipline: 'COMMERCIAL_VIDEO',
    city: 'JEDDAH',
    description:
      'Two-day shoot for the launch of our new waterfront development. We need aerial drone footage (DJI Mavic 3 minimum) plus on-site cinematic interviews with the architect. Final deliverables: 60-second hero film + 3 social cutdowns. Open to proposals on price.',
    budgetHalalas: null,
    budgetIsOpen: true,
    creatorsNeeded: 1,
    deadline: inDays(14),
    expiresAt: inDays(28),
    status: 'OPEN',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'job_seed_003',
    postedByUserId: SEED_POSTER_ID,
    postedByName: 'Shaya Al-Anezi',
    title: 'Wedding day coverage — March 14',
    discipline: 'WEDDING_PHOTOGRAPHY',
    city: 'RIYADH',
    description:
      'Looking for a primary photographer (and optional second shooter) for a 200-guest wedding outside Riyadh. Outdoor ceremony, golden hour priority. Edited gallery within 4 weeks; raw files for the first dance only.',
    budgetHalalas: 1_500_000, // 15,000 SAR
    budgetIsOpen: false,
    creatorsNeeded: 2,
    deadline: inDays(35),
    expiresAt: inDays(28),
    status: 'OPEN',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
];

export const SEED_APPLICATIONS: JobApplication[] = [];
