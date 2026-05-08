import { z } from 'zod';

export const sectionKeys = [
  'scopeOfWork',
  'deliverables',
  'paymentTerms',
  'cancellationPolicy',
  'usageRights',
  'additionalTerms',
] as const;
export type SectionKey = (typeof sectionKeys)[number];

export const updateSectionsSchema = z.object({
  scopeOfWork: z.string().min(20).max(8000),
  deliverables: z.string().min(20).max(8000),
  paymentTerms: z.string().min(20).max(8000),
  cancellationPolicy: z.string().min(20).max(8000),
  usageRights: z.string().min(20).max(8000),
  additionalTerms: z.string().max(8000).optional().or(z.literal('')),
});

export const signContractSchema = z.object({
  /** Per the PRD: typed-name signature, validated against the user's display name. */
  typedName: z.string().min(2).max(80),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the contract terms.' }),
  }),
});
export type SignContractValues = z.infer<typeof signContractSchema>;
