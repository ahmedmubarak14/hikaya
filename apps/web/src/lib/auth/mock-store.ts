import 'server-only';

import { randomUUID } from 'node:crypto';

import type { Locale } from '@/i18n/config';

import { hashPassword, verifyPassword } from './passwords';

/**
 * In-memory mock user store.
 *
 * Lives for the lifetime of the Node process. Survives Next.js dev hot-reloads
 * via the globalThis trick. Replace with calls to @hikaya/api before any real
 * traffic — DO NOT ship this file to production. It's clearly labelled and
 * isolated under `lib/auth/` so the swap is a one-day job.
 */

export type MockUserRole = 'CREATOR' | 'STUDIO_OWNER' | 'CLIENT';

export interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: MockUserRole;
  locale: Locale;
  createdAt: string;
}

interface Store {
  users: Map<string, MockUser>; // id → user
  byEmail: Map<string, string>; // email → id
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaMockAuthStore: Store | undefined;
}

const store: Store =
  globalThis.__hikayaMockAuthStore ??
  (() => {
    const fresh: Store = { users: new Map(), byEmail: new Map() };

    // Seed two demo accounts so devs can sign in immediately.
    seedUser(fresh, {
      email: 'noor@hikaya.sa',
      password: 'password123',
      displayName: 'Noor Al-Saadi',
      role: 'CREATOR',
      locale: 'en',
    });
    seedUser(fresh, {
      email: 'client@hikaya.sa',
      password: 'password123',
      displayName: 'Sample Client',
      role: 'CLIENT',
      locale: 'en',
    });

    return fresh;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaMockAuthStore = store;
}

function seedUser(
  s: Store,
  data: { email: string; password: string; displayName: string; role: MockUserRole; locale: Locale },
): void {
  const id = randomUUID();
  const user: MockUser = {
    id,
    email: data.email.toLowerCase(),
    passwordHash: hashPassword(data.password),
    displayName: data.displayName,
    role: data.role,
    locale: data.locale,
    createdAt: new Date().toISOString(),
  };
  s.users.set(id, user);
  s.byEmail.set(user.email, id);
}

export function findUserByEmail(email: string): MockUser | null {
  const id = store.byEmail.get(email.toLowerCase());
  return id ? (store.users.get(id) ?? null) : null;
}

export function findUserById(id: string): MockUser | null {
  return store.users.get(id) ?? null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  role: MockUserRole;
  locale: Locale;
}

export function createUser(input: CreateUserInput): MockUser {
  const email = input.email.toLowerCase();
  if (store.byEmail.has(email)) {
    throw new Error('EMAIL_TAKEN');
  }
  const id = randomUUID();
  const user: MockUser = {
    id,
    email,
    passwordHash: hashPassword(input.password),
    displayName: input.displayName,
    role: input.role,
    locale: input.locale,
    createdAt: new Date().toISOString(),
  };
  store.users.set(id, user);
  store.byEmail.set(email, id);
  return user;
}

export function authenticate(email: string, password: string): MockUser | null {
  const user = findUserByEmail(email);
  if (!user) return null;
  return verifyPassword(password, user.passwordHash) ? user : null;
}
