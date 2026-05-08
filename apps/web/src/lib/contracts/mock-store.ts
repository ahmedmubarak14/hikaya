import 'server-only';

import { randomBytes } from 'node:crypto';

import type { Quote } from '@/lib/quotes/mock-data';

import {
  type Contract,
  type ContractSection,
  type ContractStatus,
  SEED_CONTRACTS,
} from './mock-data';

interface Store {
  contracts: Map<string, Contract>;
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaContractsStore: Store | undefined;
}

const store: Store =
  globalThis.__hikayaContractsStore ??
  (() => {
    const fresh: Store = { contracts: new Map() };
    for (const c of SEED_CONTRACTS) fresh.contracts.set(c.id, { ...c });
    return fresh;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaContractsStore = store;
}

/* ----------------------------------- read ---------------------------------- */

export function listContractsByCreator(creatorId: string): Contract[] {
  return [...store.contracts.values()]
    .filter((c) => c.creatorId === creatorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getContractById(id: string): Contract | null {
  return store.contracts.get(id) ?? null;
}

export function getContractBySlug(slug: string): Contract | null {
  for (const c of store.contracts.values()) if (c.shareSlug === slug) return c;
  return null;
}

/* ---------------------------------- write ---------------------------------- */

function nextContractNumber(): string {
  const year = new Date().getFullYear();
  const count = [...store.contracts.values()].filter((c) => c.number.startsWith(`C-${year}-`)).length + 1;
  return `C-${year}-${String(count).padStart(4, '0')}`;
}

function uniqueSlug(base: string): string {
  const norm = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  let candidate = norm.length >= 3 ? norm : `contract-${randomBytes(3).toString('hex')}`;
  let i = 1;
  while ([...store.contracts.values()].some((c) => c.shareSlug === candidate)) {
    i += 1;
    candidate = `${norm}-${i}`;
  }
  return candidate;
}

const DEFAULT_SECTIONS: ContractSection[] = [
  {
    key: 'scopeOfWork',
    body:
      'The Photographer agrees to provide creative services as detailed in the attached quote, including pre-session planning, the session(s) listed therein, and post-production through digital delivery.',
  },
  {
    key: 'deliverables',
    body:
      'Edited digital images delivered via a private Hikaya gallery within four (4) weeks of the session date. Originals (RAW) are not delivered unless explicitly listed in the quote.',
  },
  {
    key: 'paymentTerms',
    body:
      'A 50% non-refundable retainer is due upon signature. The remaining balance is due no later than the day before the session. All payments are processed in SAR including 15% VAT where applicable.',
  },
  {
    key: 'cancellationPolicy',
    body:
      'Cancellation by the Client more than 30 days before the session: retainer applied to a future booking within 12 months. Within 30 days: retainer is forfeit. The Photographer may cancel for cause and refund all monies paid; no further liability.',
  },
  {
    key: 'usageRights',
    body:
      'The Client receives a personal-use license to all delivered images. Commercial use, including resale or use in advertising, requires a separate written license. The Photographer retains copyright and may use a representative selection in their portfolio and on social media unless mutually agreed otherwise.',
  },
  {
    key: 'additionalTerms',
    body:
      'Either party may amend this agreement only in writing, signed by both. Disputes shall be resolved per Hikaya\'s published dispute-resolution policy and the laws of the Kingdom of Saudi Arabia.',
  },
];

/**
 * Convert an approved quote to a contract. Idempotent in the sense that the
 * caller (quotes/actions.ts) only calls this on the APPROVED transition.
 */
export function createContractFromQuote(quote: Quote): Contract {
  const id = `c_${randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();
  const contract: Contract = {
    id,
    number: nextContractNumber(),
    shareSlug: uniqueSlug(`${quote.clientName}-${id.slice(2, 6)}`),
    creatorId: quote.creatorId,
    quoteId: quote.id,
    clientName: quote.clientName,
    clientEmail: quote.clientEmail,
    totalHalalas: quote.totalHalalas,
    sections: DEFAULT_SECTIONS.map((s) => ({ ...s })),
    status: 'SENT',
    createdAt: now,
    updatedAt: now,
  };
  store.contracts.set(id, contract);
  return contract;
}

export function updateContractSections(
  id: string,
  sections: ContractSection[],
): Contract {
  const existing = store.contracts.get(id);
  if (!existing) throw new Error('CONTRACT_NOT_FOUND');
  if (existing.status === 'SIGNED' || existing.status === 'CANCELLED') {
    throw new Error('CONTRACT_LOCKED');
  }
  const updated: Contract = { ...existing, sections, updatedAt: new Date().toISOString() };
  store.contracts.set(id, updated);
  return updated;
}

export function signContract(
  id: string,
  side: 'creator' | 'client',
  typedName: string,
): Contract {
  const existing = store.contracts.get(id);
  if (!existing) throw new Error('CONTRACT_NOT_FOUND');
  if (existing.status === 'CANCELLED') throw new Error('CONTRACT_CANCELLED');
  if (existing.status === 'SIGNED') return existing;

  const now = new Date().toISOString();
  const next: Contract = { ...existing, updatedAt: now };

  if (side === 'creator') {
    if (next.creatorSignedAt) return existing; // already signed
    next.creatorSignedName = typedName;
    next.creatorSignedAt = now;
  } else {
    if (next.clientSignedAt) return existing;
    next.clientSignedName = typedName;
    next.clientSignedAt = now;
  }

  if (next.creatorSignedAt && next.clientSignedAt) {
    next.status = 'SIGNED';
  } else if (next.creatorSignedAt) {
    next.status = 'CREATOR_SIGNED';
  } else if (next.clientSignedAt) {
    next.status = 'CLIENT_SIGNED';
  }

  store.contracts.set(id, next);
  return next;
}

export function cancelContract(id: string): Contract {
  const existing = store.contracts.get(id);
  if (!existing) throw new Error('CONTRACT_NOT_FOUND');
  if (existing.status === 'SIGNED') throw new Error('CONTRACT_LOCKED');
  const now = new Date().toISOString();
  const updated: Contract = { ...existing, status: 'CANCELLED', updatedAt: now };
  store.contracts.set(id, updated);
  return updated;
}

export type { ContractStatus };
