import { z } from 'zod';

const CATEGORY_VALUES = ['PRESET', 'LUT', 'TEMPLATE', 'OVERLAY', 'GUIDE', 'BUNDLE', 'OTHER'] as const;
const STATUS_VALUES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;

const urlList = (max: number) =>
  z
    .string()
    .transform((raw) =>
      raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    )
    .pipe(z.array(z.string().url()).min(0).max(max));

export const productSchema = z
  .object({
    titleEn: z.string().min(3).max(120),
    titleAr: z.string().max(120).optional().or(z.literal('')),
    descriptionEn: z.string().min(20).max(4000),
    descriptionAr: z.string().max(4000).optional().or(z.literal('')),
    category: z.enum(CATEGORY_VALUES),
    status: z.enum(STATUS_VALUES).default('DRAFT'),
    priceSar: z.coerce.number().int().nonnegative().max(100_000),
    fileUrl: z.string().url('A direct download URL is required (Cloudinary in production).'),
    freeSampleUrl: z.string().url().optional().or(z.literal('')),
    /** Newline-separated; first is the cover. */
    previewImagesRaw: urlList(10),
    /** Comma-separated free-text tags. */
    compatibleSoftwareRaw: z
      .string()
      .transform((raw) =>
        raw
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .slice(0, 10),
      )
      .pipe(z.array(z.string().min(1).max(40))),
    /** Comma-separated product IDs for BUNDLE category. */
    bundleItemIdsRaw: z
      .string()
      .optional()
      .default('')
      .transform((raw) =>
        raw
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      )
      .pipe(z.array(z.string())),
  })
  .refine((v) => v.previewImagesRaw.length >= 1, {
    message: 'Add at least one preview image URL.',
    path: ['previewImagesRaw'],
  });

export type ProductValues = z.infer<typeof productSchema>;
