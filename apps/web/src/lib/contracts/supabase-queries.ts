import 'server-only';

import type { Contract, ContractSection, ContractStatus } from './mock-data';

/**
 * Real Supabase queries for contracts (Contract table).
 *
 * Each function uses the Next.js server Supabase client (cookie-based auth,
 * anon key) and returns data shaped to match the `Contract` type from
 * mock-data.ts so downstream components don't need changes.
 *
 * Note: The DB Contract model stores sections as individual text columns
 * (scopeOfWork, deliverables, paymentTerms, cancellationPolicy, usageRights,
 * additionalTerms). The mock model uses a `sections` array. We map between
 * the two here.
 */

async function getClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

// ---------------------------------------------------------------------------
// Mapping helpers — DB row -> front-end Contract shape
// ---------------------------------------------------------------------------

interface DbContractRow {
  id: string;
  bookingId: string;
  status: string;
  bodyHtml: string;
  scopeOfWork: string | null;
  deliverables: string | null;
  paymentTerms: string | null;
  cancellationPolicy: string | null;
  usageRights: string | null;
  additionalTerms: string | null;
  pdfUrl: string | null;
  creatorSignedAt: string | null;
  creatorSignedName: string | null;
  clientSignedAt: string | null;
  clientSignedName: string | null;
  createdAt: string;
  updatedAt: string;
  Booking?: {
    creatorProfileId: string;
    clientProfileId: string;
    totalHalalas: number;
    ClientProfile?: { User?: { displayName: string; email: string } | null } | null;
    Quote?: { id: string }[] | null;
  } | null;
}

function mapContract(row: DbContractRow): Contract {
  const sectionKeys: ContractSection['key'][] = [
    'scopeOfWork',
    'deliverables',
    'paymentTerms',
    'cancellationPolicy',
    'usageRights',
    'additionalTerms',
  ];

  const sections: ContractSection[] = sectionKeys
    .filter((key) => row[key] != null)
    .map((key) => ({
      key,
      body: row[key] ?? '',
    }));

  // Derive a slug from id — the DB doesn't have shareSlug on Contract.
  const shareSlug = row.id.replace(/_/g, '-');

  return {
    id: row.id,
    number: `C-${row.id.slice(0, 10)}`,
    shareSlug,
    creatorId: row.Booking?.creatorProfileId ?? '',
    quoteId: row.Booking?.Quote?.[0]?.id,
    clientName: row.Booking?.ClientProfile?.User?.displayName ?? 'Client',
    clientEmail: row.Booking?.ClientProfile?.User?.email,
    totalHalalas: row.Booking?.totalHalalas ?? 0,
    sections,
    status: row.status as ContractStatus,
    creatorSignedName: row.creatorSignedName ?? undefined,
    creatorSignedAt: row.creatorSignedAt ?? undefined,
    clientSignedName: row.clientSignedName ?? undefined,
    clientSignedAt: row.clientSignedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const CONTRACT_SELECT = `
  id, bookingId, status, bodyHtml,
  scopeOfWork, deliverables, paymentTerms,
  cancellationPolicy, usageRights, additionalTerms,
  pdfUrl,
  creatorSignedAt, creatorSignedName,
  clientSignedAt, clientSignedName,
  createdAt, updatedAt,
  Booking (
    creatorProfileId, clientProfileId, totalHalalas,
    ClientProfile:ClientProfile ( User:User ( displayName, email ) ),
    Quote ( id )
  )
`;

// ---------------------------------------------------------------------------
// Exported query functions
// ---------------------------------------------------------------------------

export async function listContractsByCreatorFromDB(creatorId: string): Promise<Contract[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Contract')
    .select(CONTRACT_SELECT)
    .eq('Booking.creatorProfileId', creatorId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[supabase-queries] listContractsByCreatorFromDB error:', error.message);
    return [];
  }

  return (data ?? [])
    .filter((row: unknown) => (row as DbContractRow).Booking?.creatorProfileId === creatorId)
    .map((row: unknown) => mapContract(row as DbContractRow));
}

export async function getContractByIdFromDB(id: string): Promise<Contract | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Contract')
    .select(CONTRACT_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getContractByIdFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapContract(data as unknown as DbContractRow);
}

export async function getContractBySlugFromDB(slug: string): Promise<Contract | null> {
  // The DB Contract model does not have a shareSlug column.
  // We use id-based lookup; the slug is derived from the id.
  const id = slug.replace(/-/g, '_');
  return getContractByIdFromDB(id);
}
