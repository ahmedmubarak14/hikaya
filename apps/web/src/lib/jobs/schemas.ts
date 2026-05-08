import { z } from 'zod';

const CITY_VALUES = [
  'RIYADH', 'JEDDAH', 'DAMMAM', 'KHOBAR', 'MAKKAH', 'MEDINA', 'TABUK', 'ABHA',
] as const;

const DISCIPLINE_VALUES = [
  'WEDDING_PHOTOGRAPHY', 'PORTRAIT_PHOTOGRAPHY', 'COMMERCIAL_PHOTOGRAPHY',
  'PRODUCT_PHOTOGRAPHY', 'EVENT_PHOTOGRAPHY', 'FASHION_PHOTOGRAPHY',
  'COMMERCIAL_VIDEO', 'WEDDING_VIDEO', 'EVENT_VIDEO', 'DOCUMENTARY',
  'GRAPHIC_DESIGN', 'BRAND_IDENTITY', 'MOTION_GRAPHICS', 'VIDEO_EDITING',
  'COLOR_GRADING', 'RETOUCHING', 'DRONE_OPERATION',
] as const;

export const postJobSchema = z.object({
  title: z.string().min(8).max(120),
  discipline: z.enum(DISCIPLINE_VALUES),
  city: z.enum(CITY_VALUES),
  description: z.string().min(40).max(4000),
  budgetIsOpen: z.coerce.boolean().default(false),
  budgetSar: z.coerce.number().int().positive().max(10_000_000).optional().or(z.nan().transform(() => undefined)),
  creatorsNeeded: z.coerce.number().int().min(1).max(20).default(1),
  deadline: z.string().min(1, 'Required'),
  postedByCompany: z.string().max(120).optional().or(z.literal('')),
}).refine(
  (v) => v.budgetIsOpen || (v.budgetSar != null && v.budgetSar > 0),
  { message: 'Either set a budget or mark "open to proposals".', path: ['budgetSar'] },
);
export type PostJobValues = z.infer<typeof postJobSchema>;

export const applyToJobSchema = z.object({
  coverNote: z.string().min(20, 'Tell them why you (20+ chars).').max(2000),
  proposedRateSar: z.coerce.number().int().positive().max(10_000_000),
});
export type ApplyToJobValues = z.infer<typeof applyToJobSchema>;
