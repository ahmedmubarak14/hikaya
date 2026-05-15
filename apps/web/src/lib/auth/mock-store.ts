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
  /**
   * The set of roles the user holds. Multi-role is a first-class concept:
   * one user can be a Creator AND a Studio Owner AND a Client. The active
   * role for the current session is tracked separately via a cookie (see
   * `active-role.ts`); when unset we fall back to `primaryRole`.
   */
  roles: MockUserRole[];
  /** Default role for redirects when no active-role cookie is present. */
  primaryRole: MockUserRole;
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

    // Seed demo accounts so devs can sign in immediately.
    // Noor holds both Creator and Studio Owner roles — demonstrates the
    // multi-role switcher in the header.
    seedUser(fresh, {
      email: 'noor@hikaya.sa',
      password: 'password123',
      displayName: 'Noor Al-Saadi',
      roles: ['CREATOR', 'STUDIO_OWNER'],
      primaryRole: 'CREATOR',
      locale: 'en',
    });
    seedUser(fresh, {
      email: 'client@hikaya.sa',
      password: 'password123',
      displayName: 'Sample Client',
      roles: ['CLIENT'],
      primaryRole: 'CLIENT',
      locale: 'en',
    });
    // Standalone studio owner — Path B onboarding target.
    seedUser(fresh, {
      email: 'studio@hikaya.sa',
      password: 'password123',
      displayName: 'Crescent Studio',
      roles: ['STUDIO_OWNER'],
      primaryRole: 'STUDIO_OWNER',
      locale: 'en',
    });

    return fresh;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaMockAuthStore = store;
}

function seedUser(
  s: Store,
  data: {
    email: string;
    password: string;
    displayName: string;
    roles: MockUserRole[];
    primaryRole: MockUserRole;
    locale: Locale;
  },
): void {
  const id = randomUUID();
  const user: MockUser = {
    id,
    email: data.email.toLowerCase(),
    passwordHash: hashPassword(data.password),
    displayName: data.displayName,
    roles: [...data.roles],
    primaryRole: data.primaryRole,
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
    roles: [input.role],
    primaryRole: input.role,
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
