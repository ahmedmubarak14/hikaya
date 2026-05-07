import { z } from 'zod';

/**
 * Validate process.env at boot. Crashes loudly with a useful message rather
 * than failing late with cryptic runtime errors.
 */
export const configValidationSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional(),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    MOYASAR_PUBLISHABLE_KEY: z.string().optional(),
    MOYASAR_SECRET_KEY: z.string().optional(),

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),

    ALGOLIA_APP_ID: z.string().optional(),
    ALGOLIA_ADMIN_API_KEY: z.string().optional(),
  })
  .passthrough();

export type AppConfig = z.infer<typeof configValidationSchema>;
