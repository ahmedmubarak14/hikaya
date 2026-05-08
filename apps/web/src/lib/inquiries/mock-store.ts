import 'server-only';

import { randomUUID } from 'node:crypto';

/**
 * In-memory mock store for inquiries (the entry point of the hire flow).
 *
 * Survives Next dev HMR via globalThis. Replace with a NestJS module call
 * once @hikaya/api ships — the shape of `Inquiry` mirrors the Prisma model
 * `Inquiry` in packages/database, so the swap is mechanical.
 */

export type InquiryStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface Inquiry {
  id: string;
  /** Web user id (mock auth user) of the client. */
  clientUserId: string;
  /** Username slug of the creator. The mock store is creator-id agnostic. */
  creatorUsername: string;
  discipline: string;
  sessionDates: string[]; // ISO
  city: string;
  locationDetail?: string;
  description: string;
  budgetMinSar?: number;
  budgetMaxSar?: number;
  status: InquiryStatus;
  createdAt: string;
  respondsByAt: string;
}

interface Store {
  inquiries: Map<string, Inquiry>;
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaMockInquiriesStore: Store | undefined;
}

const store: Store = globalThis.__hikayaMockInquiriesStore ?? { inquiries: new Map() };

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaMockInquiriesStore = store;
}

export interface CreateInquiryInput {
  clientUserId: string;
  creatorUsername: string;
  discipline: string;
  sessionDates: string[];
  city: string;
  locationDetail?: string;
  description: string;
  budgetMinSar?: number;
  budgetMaxSar?: number;
}

export function createInquiry(input: CreateInquiryInput): Inquiry {
  const id = randomUUID();
  const now = new Date();
  const respondsBy = new Date(now.getTime() + 48 * 60 * 60 * 1000); // PRD: creator has 48h

  const inquiry: Inquiry = {
    id,
    clientUserId: input.clientUserId,
    creatorUsername: input.creatorUsername.toLowerCase(),
    discipline: input.discipline,
    sessionDates: input.sessionDates,
    city: input.city,
    locationDetail: input.locationDetail,
    description: input.description,
    budgetMinSar: input.budgetMinSar,
    budgetMaxSar: input.budgetMaxSar,
    status: 'PENDING',
    createdAt: now.toISOString(),
    respondsByAt: respondsBy.toISOString(),
  };

  store.inquiries.set(id, inquiry);
  return inquiry;
}

export function listInquiriesByClient(clientUserId: string): Inquiry[] {
  return [...store.inquiries.values()]
    .filter((i) => i.clientUserId === clientUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listInquiriesForCreator(creatorUsername: string): Inquiry[] {
  return [...store.inquiries.values()]
    .filter((i) => i.creatorUsername === creatorUsername.toLowerCase())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
