import { z } from 'zod';

import { citySchema, countrySchema, localeSchema } from './common';

/** Creative discipline tags surfaced in profiles, search, and the job board. */
export const disciplineSchema = z.enum([
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
]);
export type Discipline = z.infer<typeof disciplineSchema>;

export const availabilitySchema = z.enum(['AVAILABLE', 'BUSY', 'ON_VACATION']);
export type Availability = z.infer<typeof availabilitySchema>;

export const socialLinksSchema = z
  .object({
    instagram: z.string().url().optional(),
    youtube: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    website: z.string().url().optional(),
  })
  .strict();
export type SocialLinks = z.infer<typeof socialLinksSchema>;

export const creatorProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string().min(3).max(40),
  displayNameEn: z.string().min(2).max(80),
  displayNameAr: z.string().min(2).max(80).nullable(),
  bioEn: z.string().max(500).nullable(),
  bioAr: z.string().max(500).nullable(),
  avatarUrl: z.string().url().nullable(),
  coverUrl: z.string().url().nullable(),
  disciplines: z.array(disciplineSchema).min(1),
  city: citySchema,
  country: countrySchema,
  startingPriceSar: z.number().int().nonnegative().nullable(),
  yearsExperience: z.number().int().min(0).max(70).nullable(),
  languages: z.array(localeSchema).min(1),
  equipment: z.array(z.string()).max(20),
  availability: availabilitySchema,
  socialLinks: socialLinksSchema,
  reviewScore: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  isVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CreatorProfile = z.infer<typeof creatorProfileSchema>;

export const updateCreatorProfileSchema = creatorProfileSchema.partial().omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  reviewScore: true,
  reviewCount: true,
  isVerified: true,
});
export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>;
