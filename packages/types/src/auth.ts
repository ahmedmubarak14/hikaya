import { z } from 'zod';

import { localeSchema } from './common';

export const userRoleSchema = z.enum([
  'CREATOR',
  'STUDIO_OWNER',
  'CLIENT',
  'AGENCY',          // Phase 3
  'RENTAL_COMPANY',  // Phase 2
  'ADMIN',
]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const signUpSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    displayName: z.string().min(2).max(80),
    role: userRoleSchema.default('CLIENT'),
    locale: localeSchema.default('en'),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'Terms must be accepted.' }),
    }),
  })
  .strict();
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();
export type SignInInput = z.infer<typeof signInSchema>;

export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  roles: z.array(userRoleSchema).min(1),
  activeRole: userRoleSchema,
  locale: localeSchema,
  avatarUrl: z.string().url().nullable(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;
