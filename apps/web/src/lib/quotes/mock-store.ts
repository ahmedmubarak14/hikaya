import 'server-only';

import { randomBytes, randomUUID } from 'node:crypto';

import { computeQuoteTotals, SEED_QUOTES, type Quote, type QuoteLineItem, type QuoteStatus } from './mock-data';

interface Store {
  quotes: Map<string, Quote>;
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaQuotesStore: Store | undefined;
}

const store: Store =
  globalThis.__hikayaQuotesStore ??
  (() => {
    const fresh: Store = { quotes: new Map() };
    for (const q of SEED_QUOTES) {
      fresh.quotes.set(q.id, {
        ...q,
        lineItems: q.lineItems.map((li) => ({ ...li })),
      });
    }
    return fresh;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaQuotesStore = store;
}

/* ----------------------------------- read ---------------------------------- */

export function listQuotesByCreator(creatorId: string): Quote[] {
  return [...store.quotes.values()]
    .filter((q) => q.creatorId === creatorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getQuoteById(id: string): Quote | null {
  return store.quotes.get(id) ?? null;
}

export function getQuoteBySlug(slug: string): Quote | null {
  for (const q of store.quotes.values()) if (q.shareSlug === slug) return q;
  return null;
}

/* ---------------------------------- write ---------------------------------- */

export interface CreateQuoteInput {
  creatorId: string;
  clientName: string;
  clientEmail?: string;
  notes?: string;
  expiresInDays?: number;
  lineItems: { descriptionEn: string; descriptionAr?: string; quantity: number; unitHalalas: number }[];
  discountHalalas?: number;
}

function nextQuoteNumber(): string {
  const year = new Date().getFullYear();
  // Count existing quotes this year — fine for the mock; real backend uses a sequence.
  const count = [...store.quotes.values()].filter((q) => q.number.startsWith(`Q-${year}-`)).length + 1;
  return `Q-${year}-${String(count).padStart(4, '0')}`;
}

function uniqueSlug(base: string): string {
  const norm = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  let candidate = norm.length >= 3 ? norm : `quote-${randomBytes(3).toString('hex')}`;
  let i = 1;
  while ([...store.quotes.values()].some((q) => q.shareSlug === candidate)) {
    i += 1;
    candidate = `${norm}-${i}`;
  }
  return candidate;
}

export function createQuote(input: CreateQuoteInput): Quote {
  const id = `q_${randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();

  const lineItems: QuoteLineItem[] = input.lineItems.map((li) => ({
    id: randomUUID(),
    descriptionEn: li.descriptionEn,
    descriptionAr: li.descriptionAr,
    quantity: li.quantity,
    unitHalalas: li.unitHalalas,
    totalHalalas: Math.max(0, Math.round(li.quantity * li.unitHalalas)),
  }));

  const totals = computeQuoteTotals(lineItems, input.discountHalalas ?? 0);
  const expiresAt =
    input.expiresInDays && input.expiresInDays > 0
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

  const quote: Quote = {
    id,
    number: nextQuoteNumber(),
    shareSlug: uniqueSlug(`${input.clientName}-${id.slice(2, 6)}`),
    creatorId: input.creatorId,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    notes: input.notes,
    status: 'DRAFT',
    expiresAt,
    lineItems,
    ...totals,
    createdAt: now,
    updatedAt: now,
  };
  store.quotes.set(id, quote);
  return quote;
}

export function updateQuoteStatus(
  id: string,
  status: QuoteStatus,
  extra: { rejectReason?: string } = {},
): Quote {
  const existing = store.quotes.get(id);
  if (!existing) throw new Error('QUOTE_NOT_FOUND');
  const now = new Date().toISOString();
  const updated: Quote = {
    ...existing,
    status,
    approvedAt: status === 'APPROVED' ? now : existing.approvedAt,
    rejectedAt: status === 'REJECTED' ? now : existing.rejectedAt,
    rejectReason: status === 'REJECTED' ? extra.rejectReason : existing.rejectReason,
    updatedAt: now,
  };
  store.quotes.set(id, updated);
  return updated;
}

export function setQuoteContractId(id: string, contractId: string): void {
  const existing = store.quotes.get(id);
  if (!existing) return;
  store.quotes.set(id, { ...existing, contractId, updatedAt: new Date().toISOString() });
}

export function deleteQuote(id: string): void {
  store.quotes.delete(id);
}
