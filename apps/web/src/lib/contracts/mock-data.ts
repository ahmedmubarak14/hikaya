/**
 * Contract shape — mirrors the Prisma `Contract` model.
 *
 * Per the PRD: typed-name signatures + ISO timestamp on both sides. Once both
 * have signed, the contract is locked and would (in the real backend) emit a
 * PDF copy. The mock skips the PDF.
 */

export type ContractStatus =
  | 'DRAFT'
  | 'SENT'
  | 'CREATOR_SIGNED'
  | 'CLIENT_SIGNED'
  | 'SIGNED'
  | 'CANCELLED';

export interface ContractSection {
  /** Stable section key, used as form field name. */
  key:
    | 'scopeOfWork'
    | 'deliverables'
    | 'paymentTerms'
    | 'cancellationPolicy'
    | 'usageRights'
    | 'additionalTerms';
  body: string;
}

export interface Contract {
  id: string;
  /** Sequential, e.g. C-2026-0007. */
  number: string;
  shareSlug: string;
  creatorId: string;
  /** Optional link back to the quote that produced it. */
  quoteId?: string;

  clientName: string;
  clientEmail?: string;

  totalHalalas: number;
  sections: ContractSection[];

  status: ContractStatus;
  creatorSignedName?: string;
  creatorSignedAt?: string;
  clientSignedName?: string;
  clientSignedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export const SEED_CONTRACTS: Contract[] = [];
