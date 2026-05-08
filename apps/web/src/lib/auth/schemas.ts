import { z } from 'zod';

import { locales } from '@/i18n/config';

/**
 * Form-facing zod schemas. The shapes mirror @hikaya/types/auth but pare down
 * to the fields the form actually surfaces (no `acceptedTerms` literal in
 * sign-in; no role on sign-up — defaulted to CLIENT for now).
 */

export const signInFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Required'),
});
export type SignInFormValues = z.infer<typeof signInFormSchema>;

export const signUpFormSchema = z.object({
  displayName: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters').max(128),
  role: z.enum(['CREATOR', 'CLIENT']).default('CLIENT'),
  locale: z.enum(locales).default('en'),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to continue.' }),
  }),
});
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
