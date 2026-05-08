import { z } from 'zod';

export const createGallerySchema = z.object({
  titleEn: z.string().min(3).max(120),
  titleAr: z.string().max(120).optional().or(z.literal('')),
  message: z.string().max(2000).optional().or(z.literal('')),
  coverUrl: z.string().url().optional().or(z.literal('')),
  allowDownloads: z.coerce.boolean().default(true),
  watermarkPreviews: z.coerce.boolean().default(false),
  expiresInDays: z.coerce.number().int().positive().max(365).optional().or(z.nan().transform(() => undefined)),
});
export type CreateGalleryValues = z.infer<typeof createGallerySchema>;

export const addImagesSchema = z.object({
  /**
   * Newline-separated URLs. Empty lines and whitespace-only lines are dropped.
   * Capped at 50 per submission so a fat paste doesn't lock the UI.
   */
  urls: z
    .string()
    .min(1)
    .transform((raw) =>
      raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 50),
    )
    .pipe(z.array(z.string().url()).min(1, 'Please add at least one valid URL.')),
});
export type AddImagesValues = z.infer<typeof addImagesSchema>;
