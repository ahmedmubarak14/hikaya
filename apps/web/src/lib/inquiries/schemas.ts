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

export const inquiryFormSchema = z
  .object({
    discipline: z.enum(DISCIPLINE_VALUES),
    sessionDate: z.string().min(1, 'Required'),
    city: z.enum(CITY_VALUES),
    locationDetail: z.string().max(200).optional().or(z.literal('')),
    description: z.string().min(20, 'Tell the creator a bit more (20+ chars).').max(2000),
    budgetMinSar: z.coerce.number().int().positive().optional().or(z.nan().transform(() => undefined)),
    budgetMaxSar: z.coerce.number().int().positive().optional().or(z.nan().transform(() => undefined)),
  })
  .refine(
    (v) => v.budgetMinSar == null || v.budgetMaxSar == null || v.budgetMinSar <= v.budgetMaxSar,
    { message: 'Min must be less than max', path: ['budgetMaxSar'] },
  );

export type InquiryFormValues = z.infer<typeof inquiryFormSchema>;
