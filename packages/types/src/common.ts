import { z } from 'zod';

export const localeSchema = z.enum(['en', 'ar']);
export type Locale = z.infer<typeof localeSchema>;

export const idSchema = z.string().cuid2().or(z.string().uuid());
export type Id = z.infer<typeof idSchema>;

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(24),
});
export type Pagination = z.infer<typeof paginationSchema>;

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Cities supported in Phase 1. Stored as enum so search facets and analytics
 * can rely on a closed set; expanded to a full lookup in Phase 2 (Gulf-wide).
 */
export const citySchema = z.enum([
  'RIYADH',
  'JEDDAH',
  'DAMMAM',
  'KHOBAR',
  'MAKKAH',
  'MEDINA',
  'TABUK',
  'ABHA',
]);
export type City = z.infer<typeof citySchema>;

export const countrySchema = z.enum(['SA', 'AE', 'KW', 'QA', 'BH', 'OM']);
export type Country = z.infer<typeof countrySchema>;
