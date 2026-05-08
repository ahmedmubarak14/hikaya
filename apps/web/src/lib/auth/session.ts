import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

import { cookies } from 'next/headers';

import { findUserById, type MockUser } from './mock-store';

/**
 * Cookie-based session for the mock auth flow.
 *
 * Layout: `cookie = base64url(JSON payload).base64url(HMAC-SHA256(payload))`
 *
 * Why not iron-session / next-auth? Both add dependencies and policy. The mock
 * is intentionally a thin file so the eventual swap to JWT-from-API is small
 * and obvious.
 */

const COOKIE_NAME = 'hikaya_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches the API's JWT_EXPIRES_IN

interface SessionPayload {
  uid: string;
  iat: number; // issued at (unix seconds)
}

export interface Session {
  user: Pick<MockUser, 'id' | 'email' | 'displayName' | 'role' | 'locale'>;
}

function getSecret(): string {
  // In dev we tolerate a stable fallback so contributors don't need extra setup.
  return process.env.AUTH_SECRET ?? 'hikaya-dev-secret-do-not-ship-to-production';
}

function base64urlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(input.length + ((4 - (input.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64');
}

function sign(payloadB64: string): string {
  const mac = createHmac('sha256', getSecret()).update(payloadB64).digest();
  return base64urlEncode(mac);
}

function buildCookieValue(uid: string): string {
  const payload: SessionPayload = { uid, iat: Math.floor(Date.now() / 1000) };
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

function parseCookieValue(value: string): SessionPayload | null {
  const [payloadB64, sig] = value.split('.');
  if (!payloadB64 || !sig) return null;

  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const decoded = JSON.parse(base64urlDecode(payloadB64).toString('utf8')) as SessionPayload;
    if (typeof decoded.uid !== 'string' || typeof decoded.iat !== 'number') return null;
    if (Date.now() / 1000 - decoded.iat > MAX_AGE_SECONDS) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  (await cookies()).set(COOKIE_NAME, buildCookieValue(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  // Static export build (GitHub Pages) has no cookies — treat as logged out.
  if (process.env.EXPORT === '1') return null;

  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const payload = parseCookieValue(raw);
  if (!payload) return null;

  const user = findUserById(payload.uid);
  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      locale: user.locale,
    },
  };
}
