/**
 * Quote shapes — mirror the Prisma `Quote` + `QuoteLineItem` models.
 *
 * Money throughout is stored as integer SAR halalas (1 SAR = 100 halalas) per
 * the platform convention. The 15% ZATCA VAT and totals are computed on every
 * mutation so the UI never sums client-side.
 */

export type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface QuoteLineItem {
  id: string;
  descriptionEn: string;
  descriptionAr?: string;
  quantity: number;
  unitHalalas: number;
  totalHalalas: number;
}

export interface Quote {
  id: string;
  number: string;          // human-readable, e.g. "Q-2026-0007"
  shareSlug: string;       // url slug at /q/<slug>
  creatorId: string;
  /** Free-text client name; in the real model this is a ClientProfile fk. */
  clientName: string;
  clientEmail?: string;
  notes?: string;
  status: QuoteStatus;
  expiresAt?: string;      // ISO
  approvedAt?: string;     // ISO
  rejectedAt?: string;     // ISO
  rejectReason?: string;
  /** When set, the quote has been converted to a contract. */
  contractId?: string;
  lineItems: QuoteLineItem[];
  subtotalHalalas: number;
  vatHalalas: number;
  discountHalalas: number;
  totalHalalas: number;
  createdAt: string;
  updatedAt: string;
}

export const VAT_RATE = 0.15 as const;

export function computeLineTotal(quantity: number, unitHalalas: number): number {
  return Math.max(0, Math.round(quantity * unitHalalas));
}

export function computeQuoteTotals(
  lineItems: QuoteLineItem[],
  discountHalalas = 0,
): Pick<Quote, 'subtotalHalalas' | 'vatHalalas' | 'discountHalalas' | 'totalHalalas'> {
  const subtotal = lineItems.reduce((sum, li) => sum + li.totalHalalas, 0);
  const afterDiscount = Math.max(0, subtotal - discountHalalas);
  const vat = Math.round(afterDiscount * VAT_RATE);
  return {
    subtotalHalalas: subtotal,
    vatHalalas: vat,
    discountHalalas,
    totalHalalas: afterDiscount + vat,
  };
}

/* --------------------------------- seed ---------------------------------- */

const now = new Date();
const inDays = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const seedItem = (
  id: string,
  descriptionEn: string,
  descriptionAr: string,
  quantity: number,
  unitHalalas: number,
): QuoteLineItem => ({
  id,
  descriptionEn,
  descriptionAr,
  quantity,
  unitHalalas,
  totalHalalas: computeLineTotal(quantity, unitHalalas),
});

const seedItems_sara = [
  seedItem('q1-li-1', 'Wedding day coverage (8 hours)', 'تغطية يوم الزفاف (٨ ساعات)', 1, 1_200_000),
  seedItem('q1-li-2', 'Second photographer', 'مصوّر مساعد', 1, 350_000),
  seedItem('q1-li-3', 'Edited gallery — 400 images', 'معرض محرَّر — ٤٠٠ صورة', 1, 250_000),
];
const totals_sara = computeQuoteTotals(seedItems_sara);

export const SEED_QUOTES: Quote[] = [
  {
    id: 'q_sara_001',
    number: 'Q-2026-0001',
    shareSlug: 'sara-hassan-wedding-q1',
    creatorId: 'cr_noor',
    clientName: 'Sara Al-Harbi',
    clientEmail: 'sara@example.com',
    notes:
      'Includes raw files for the first dance only. Hard drive delivery in 4 weeks.',
    status: 'SENT',
    expiresAt: inDays(7),
    lineItems: seedItems_sara,
    ...totals_sara,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
];
