import { z } from 'zod';

const STATUS_VALUES = ['DRAFT', 'PUBLISHED'] as const;

const tagsList = z
  .string()
  .transform((raw) =>
    raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 10),
  )
  .pipe(z.array(z.string().min(1).max(30)));

export const createPostSchema = z.object({
  titleEn: z.string().min(3, 'Title must be at least 3 characters').max(160),
  titleAr: z.string().max(160).optional().or(z.literal('')),
  coverUrl: z.string().url().optional().or(z.literal('')),
  bodyEn: z.string().min(50, 'Body must be at least 50 characters').max(20_000),
  bodyAr: z.string().max(20_000).optional().or(z.literal('')),
  tagsRaw: tagsList,
  status: z.enum(STATUS_VALUES).default('DRAFT'),
  slug: z.string().max(80).optional().or(z.literal('')),
});

export const updatePostSchema = createPostSchema;

export type CreatePostValues = z.infer<typeof createPostSchema>;
export type UpdatePostValues = z.infer<typeof updatePostSchema>;
