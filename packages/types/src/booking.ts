import { z } from 'zod';

import { citySchema } from './common';
import { disciplineSchema } from './user';

export const bookingStatusSchema = z.enum([
  'INQUIRY', // Client sent inquiry, creator hasn't responded
  'QUOTED', // Creator sent a quote
  'CONTRACTED', // Quote approved, contract sent
  'CONFIRMED', // Both parties signed, deposit paid (escrow)
  'IN_PROGRESS', // Session date(s) underway
  'DELIVERED', // Gallery delivered, awaiting client review
  'COMPLETED', // Funds released to creator wallet
  'CANCELLED',
  'DISPUTED',
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const inquirySchema = z
  .object({
    creatorId: z.string(),
    discipline: disciplineSchema,
    sessionDates: z.array(z.string().datetime()).min(1),
    city: citySchema,
    locationDetail: z.string().max(200).optional(),
    description: z.string().min(20).max(2000),
    budgetMinSar: z.number().int().positive().optional(),
    budgetMaxSar: z.number().int().positive().optional(),
    attachmentUrls: z.array(z.string().url()).max(5).default([]),
  })
  .strict()
  .refine(
    (v) => v.budgetMinSar == null || v.budgetMaxSar == null || v.budgetMinSar <= v.budgetMaxSar,
    { message: 'budgetMinSar must be ≤ budgetMaxSar', path: ['budgetMaxSar'] },
  );
export type InquiryInput = z.infer<typeof inquirySchema>;

export const jobPostSchema = z
  .object({
    title: z.string().min(8).max(120),
    discipline: disciplineSchema,
    deadline: z.string().datetime(),
    city: citySchema,
    description: z.string().min(40).max(4000),
    budgetSar: z.number().int().positive().nullable(),
    budgetIsOpen: z.boolean().default(false),
    creatorsNeeded: z.number().int().min(1).max(20).default(1),
  })
  .strict();
export type JobPostInput = z.infer<typeof jobPostSchema>;

export const jobApplicationSchema = z
  .object({
    jobId: z.string(),
    coverNote: z.string().min(20).max(2000),
    proposedRateSar: z.number().int().positive(),
  })
  .strict();
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
