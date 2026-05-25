import 'server-only';

import type { Contract } from './mock-data';
import {
  getContractById as getContractByIdRaw,
  getContractBySlug as getContractBySlugRaw,
  listContractsByCreator as listContractsByCreatorRaw,
} from './mock-store';

/**
 * Server-only query helpers. When EXPORT=1 (static export), we use mock data
 * directly. Otherwise we try the real Supabase query first and fall back to
 * mock data if the result is empty (gradual migration).
 */

const isStaticExport = process.env.EXPORT === '1';

export async function listContractsByCreator(creatorId: string): Promise<Contract[]> {
  if (!isStaticExport) {
    try {
      const { listContractsByCreatorFromDB } = await import('./supabase-queries');
      const result = await listContractsByCreatorFromDB(creatorId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return listContractsByCreatorRaw(creatorId);
}

export async function getContractById(id: string): Promise<Contract | null> {
  if (!isStaticExport) {
    try {
      const { getContractByIdFromDB } = await import('./supabase-queries');
      const result = await getContractByIdFromDB(id);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getContractByIdRaw(id);
}

export async function getContractBySlug(slug: string): Promise<Contract | null> {
  if (!isStaticExport) {
    try {
      const { getContractBySlugFromDB } = await import('./supabase-queries');
      const result = await getContractBySlugFromDB(slug);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getContractBySlugRaw(slug);
}
