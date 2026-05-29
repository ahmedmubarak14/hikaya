import { z } from 'zod';

const CITY_VALUES = [
  'RIYADH',
  'JEDDAH',
  'DAMMAM',
  'KHOBAR',
  'MAKKAH',
  'MEDINA',
  'TABUK',
  'ABHA',
] as const;

const DISCIPLINE_VALUES = [
  'WEDDING_PHOTOGRAPHY',
  'PORTRAIT_PHOTOGRAPHY',
  'COMMERCIAL_PHOTOGRAPHY',
  'PRODUCT_PHOTOGRAPHY',
  'EVENT_PHOTOGRAPHY',
  'FASHION_PHOTOGRAPHY',
  'COMMERCIAL_VIDEO',
  'WEDDING_VIDEO',
  'EVENT_VIDEO',
  'DOCUMENTARY',
  'GRAPHIC_DESIGN',
  'BRAND_IDENTITY',
  'MOTION_GRAPHICS',
  'VIDEO_EDITING',
  'COLOR_GRADING',
  'RETOUCHING',
  'DRONE_OPERATION',
] as const;

export const profileEditSchema = z.object({
  displayNameEn: z.string().min(2).max(80),
  displayNameAr: z.string().min(2).max(80),
  bioEn: z.string().max(500).optional().or(z.literal('')),
  bioAr: z.string().max(500).optional().or(z.literal('')),
  city: z.enum(CITY_VALUES),
  disciplines: z.array(z.enum(DISCIPLINE_VALUES)).min(1).max(5),
  startingPriceSar: z.coerce
    .number()
    .int()
    .nonnegative()
    .optional()
    .or(z.nan().transform(() => undefined)),
  availability: z.enum(['AVAILABLE', 'BUSY', 'ON_VACATION']),
  preferredLayout: z.enum(['MASONRY', 'EDITORIAL', 'REEL']),
  /** Optional hex color (#rrggbb). Empty string clears. */
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex like #c8d32d').optional().or(z.literal('')),
  /** Comma-separated section order (work,store,about). Empty = default. */
  sectionsOrder: z.string().optional().or(z.literal('')),
});

export type ProfileEditValues = z.infer<typeof profileEditSchema>;

export const portfolioItemAddSchema = z.object({
  url: z.string().url('Please paste a valid image URL.').optional().or(z.literal('')),
  titleEn: z.string().max(120).optional().or(z.literal('')),
});
export type PortfolioItemAddValues = z.infer<typeof portfolioItemAddSchema>;
