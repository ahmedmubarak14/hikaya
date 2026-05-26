/**
 * In-memory token-bucket rate limiter.
 *
 * Fine for a single Vercel instance. For multi-instance deployments,
 * swap to Redis-based rate limiting (e.g. @upstash/ratelimit).
 */

interface BucketConfig {
  /** Maximum tokens in the bucket. */
  maxTokens: number;
  /** Time window in milliseconds to refill to maxTokens. */
  refillMs: number;
}

interface BucketState {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, BucketState>();

/**
 * Predefined rate-limit profiles used across the platform.
 *
 * Each profile defines a token-bucket configuration. The key used in
 * the bucket map is `${profile}:${userId}`.
 */
export const RATE_LIMIT_PROFILES = {
  /** 30 messages per minute */
  sendMessage: { maxTokens: 30, refillMs: 60_000 } satisfies BucketConfig,
  /** 10 threads per hour */
  startThread: { maxTokens: 10, refillMs: 3_600_000 } satisfies BucketConfig,
  /** 5 inquiries per hour */
  submitInquiry: { maxTokens: 5, refillMs: 3_600_000 } satisfies BucketConfig,
  /** 3 jobs per day */
  postJob: { maxTokens: 3, refillMs: 86_400_000 } satisfies BucketConfig,
} as const;

export type RateLimitProfile = keyof typeof RATE_LIMIT_PROFILES;

/**
 * Try to consume one token for the given profile + userId.
 *
 * Returns `{ allowed: true }` if the action is permitted, or
 * `{ allowed: false, retryAfterMs }` if the caller should back off.
 */
export function checkRateLimit(
  profile: RateLimitProfile,
  userId: string,
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const config = RATE_LIMIT_PROFILES[profile];
  const key = `${profile}:${userId}`;
  const now = Date.now();

  let state = buckets.get(key);

  if (!state) {
    // First request — create bucket with full tokens minus one
    buckets.set(key, { tokens: config.maxTokens - 1, lastRefill: now });
    return { allowed: true };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - state.lastRefill;
  const refillRate = config.maxTokens / config.refillMs; // tokens per ms
  const refilled = Math.min(config.maxTokens, state.tokens + elapsed * refillRate);

  state.tokens = refilled;
  state.lastRefill = now;

  if (state.tokens >= 1) {
    state.tokens -= 1;
    return { allowed: true };
  }

  // Not enough tokens — compute retry time
  const deficit = 1 - state.tokens;
  const retryAfterMs = Math.ceil(deficit / refillRate);

  return { allowed: false, retryAfterMs };
}

/**
 * Periodically clean up stale bucket entries to prevent unbounded memory growth.
 * Runs every 10 minutes and removes entries that haven't been touched
 * for longer than the longest window (24 hours).
 */
const CLEANUP_INTERVAL = 10 * 60_000;
const MAX_STALENESS = 86_400_000; // 24 hours

if (typeof globalThis !== 'undefined') {
  // Avoid duplicate intervals in dev with hot-reload
  const g = globalThis as unknown as { __hikayaRateLimitCleanup?: ReturnType<typeof setInterval> };
  if (!g.__hikayaRateLimitCleanup) {
    g.__hikayaRateLimitCleanup = setInterval(() => {
      const cutoff = Date.now() - MAX_STALENESS;
      for (const [key, state] of buckets) {
        if (state.lastRefill < cutoff) {
          buckets.delete(key);
        }
      }
    }, CLEANUP_INTERVAL);

    // Unref so it doesn't prevent Node from exiting
    if (typeof g.__hikayaRateLimitCleanup === 'object' && 'unref' in g.__hikayaRateLimitCleanup) {
      (g.__hikayaRateLimitCleanup as NodeJS.Timeout).unref();
    }
  }
}
