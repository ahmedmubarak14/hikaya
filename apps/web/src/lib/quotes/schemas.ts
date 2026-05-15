import { z } from 'zod';

const lineItemSchema = z.object({
  descriptionEn: z.string().min(2).max(200),
  descriptionAr: z.string().max(200).optional().or(z.literal('')),
  /** Quantity, integer ≥ 1. */
  quantity: z.coerce.number().int().min(1).max(999),
  /** Unit price in SAR. Integer for the mock; halalas computed at action time. */
  unitSar: z.coerce.number().int().nonnegative().max(10_000_000),
});
export type LineItemValues = z.infer<typeof lineItemSchema>;

export const createQuoteSchema = z.object({
  clientName: z.string().min(2).max(80),
  clientEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  expiresInDays: z.coerce
    .number()
    .int()
    .positive()
    .max(90)
    .optional()
    .or(z.nan().transform(() => undefined)),
  discountSar: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(10_000_000)
    .optional()
    .or(z.nan().transform(() => undefined)),
  lineItems: z.array(lineItemSchema).min(1, 'Add at least one line item.').max(20),
});
export type CreateQuoteValues = z.infer<typeof createQuoteSchema>;

export const rejectQuoteSchema = z.object({
  reason: z.string().max(500).optional().or(z.literal('')),
});
export type RejectQuoteValues = z.infer<typeof rejectQuoteSchema>;
