import { z } from 'zod';

/**
 * Saudi Arabia is the only payment-active region in Phase 1, so the platform
 * stores monetary values as SAR halalas (1 SAR = 100 halalas) to avoid float
 * rounding bugs. UI converts to SAR for display.
 */
export const SAR_VAT_RATE = 0.15 as const;

export const currencySchema = z.enum(['SAR']);
export type Currency = z.infer<typeof currencySchema>;

/** Money is always integer halalas. Convert at the boundary. */
export const moneySchema = z.object({
  amountHalalas: z.number().int().nonnegative(),
  currency: currencySchema,
});
export type Money = z.infer<typeof moneySchema>;

export const sarToHalalas = (sar: number): number => Math.round(sar * 100);
export const halalasToSar = (halalas: number): number => halalas / 100;

export const formatSar = (halalas: number, locale: 'en' | 'ar' = 'en'): string =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(halalasToSar(halalas));

export const computeVat = (subtotalHalalas: number): number =>
  Math.round(subtotalHalalas * SAR_VAT_RATE);

export const computeTotalWithVat = (subtotalHalalas: number): number =>
  subtotalHalalas + computeVat(subtotalHalalas);
