/**
 * Re-exports Prisma client + types so app code does:
 *   import { prisma, type User } from '@hikaya/database';
 *
 * The wrapper enforces a single PrismaClient instance across hot-reloads in
 * dev (Next.js / NestJS in watch mode would otherwise leak connections).
 */
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __hikayaPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__hikayaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaPrisma = prisma;
}

export * from '@prisma/client';
