import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Password hashing for the mock auth store. Uses scrypt (built into Node) so
 * we don't pull a native dependency for the mock layer; the real backend in
 * @hikaya/api uses argon2.
 *
 * Stored format: `<salt-hex>:<derived-hex>`
 */

const KEYLEN = 64;
const COST = 16384;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, KEYLEN, { N: COST }).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, derivedHex] = stored.split(':');
  if (!salt || !derivedHex) return false;

  const derived = scryptSync(password, salt, KEYLEN, { N: COST });
  const expected = Buffer.from(derivedHex, 'hex');
  if (derived.length !== expected.length) return false;

  return timingSafeEqual(derived, expected);
}
