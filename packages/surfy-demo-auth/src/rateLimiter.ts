/**
 * In-memory token-bucket rate limiter for the demo proxy.
 *
 * Goal: stop a single client (or the demo as a whole) from flooding the upstream
 * Surfy API. Token buckets allow short bursts up to `capacity` while capping the
 * sustained rate at `refillPerSec`.
 *
 * Scope caveat: state lives in the process memory. In the long-running demo-server
 * this is reliable. On serverless (Netlify Functions) each warm instance has its own
 * buckets, so this is best-effort there — the durable safety net is a Surfy-side
 * quota / read-only API user. Never rely on this as your only protection for secrets.
 */

export type RateLimitResult = {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterMs: number;
};

export type TokenBucketOptions = {
  /** Burst capacity (max tokens held at once). */
  readonly capacity: number;
  /** Sustained refill rate, tokens per second. */
  readonly refillPerSec: number;
  /** Upper bound on tracked keys; oldest is evicted past this (bounds memory). */
  readonly maxKeys?: number;
};

type Bucket = { tokens: number; updatedAt: number };

export class TokenBucketRateLimiter {
  private readonly capacity: number;
  private readonly refillPerSec: number;
  private readonly maxKeys: number;
  private readonly buckets = new Map<string, Bucket>();

  constructor(options: TokenBucketOptions) {
    this.capacity = Math.max(1, options.capacity);
    this.refillPerSec = Math.max(0, options.refillPerSec);
    this.maxKeys = Math.max(1, options.maxKeys ?? 10_000);
  }

  take(key: string, now: number = Date.now()): RateLimitResult {
    let bucket = this.buckets.get(key);
    if (!bucket) {
      if (this.buckets.size >= this.maxKeys) {
        const oldest = this.buckets.keys().next().value;
        if (oldest !== undefined) this.buckets.delete(oldest);
      }
      bucket = { tokens: this.capacity, updatedAt: now };
      this.buckets.set(key, bucket);
    } else {
      const elapsedSec = (now - bucket.updatedAt) / 1000;
      if (elapsedSec > 0) {
        bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsedSec * this.refillPerSec);
        bucket.updatedAt = now;
      }
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 };
    }

    const needed = 1 - bucket.tokens;
    const retryAfterMs =
      this.refillPerSec > 0 ? Math.ceil((needed / this.refillPerSec) * 1000) : Number.POSITIVE_INFINITY;
    return { allowed: false, remaining: 0, retryAfterMs };
  }
}

export type DemoRateLimitDecision = {
  readonly allowed: boolean;
  /** Seconds to wait before retrying (for the `Retry-After` header). */
  readonly retryAfterSec: number;
  /** Which limit tripped, when denied. */
  readonly scope?: 'ip' | 'global';
};

export type DemoProxyRateLimiter = {
  /** Consume one unit for `clientKey`; enforces both the per-client and global caps. */
  check(clientKey: string, now?: number): DemoRateLimitDecision;
};

function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const parsed = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Build the demo proxy rate limiter from env, or `null` when disabled.
 *
 * Env (all optional):
 *   DEMO_RATE_LIMIT_DISABLED=1          → turn limiting off
 *   DEMO_RATE_LIMIT_PER_MIN=120         → sustained requests/min per client IP
 *   DEMO_RATE_LIMIT_BURST=<per-min>     → burst capacity per client IP
 *   DEMO_RATE_LIMIT_GLOBAL_PER_MIN      → cap across ALL clients (protects Surfy)
 */
export function createDemoProxyRateLimiter(
  env: NodeJS.ProcessEnv = process.env,
): DemoProxyRateLimiter | null {
  if (env.DEMO_RATE_LIMIT_DISABLED === '1' || env.DEMO_RATE_LIMIT_DISABLED === 'true') {
    return null;
  }

  const perMin = readPositiveInt(env.DEMO_RATE_LIMIT_PER_MIN, 120);
  const burst = readPositiveInt(env.DEMO_RATE_LIMIT_BURST, perMin);
  const globalPerMin = readPositiveInt(
    env.DEMO_RATE_LIMIT_GLOBAL_PER_MIN,
    Math.max(perMin * 5, 600),
  );

  const perIp = new TokenBucketRateLimiter({
    capacity: burst,
    refillPerSec: perMin / 60,
    maxKeys: 5_000,
  });
  const global = new TokenBucketRateLimiter({
    capacity: globalPerMin,
    refillPerSec: globalPerMin / 60,
    maxKeys: 1,
  });

  return {
    check(clientKey: string, now?: number): DemoRateLimitDecision {
      const perIpResult = perIp.take(clientKey || 'unknown', now);
      if (!perIpResult.allowed) {
        return {
          allowed: false,
          retryAfterSec: Math.max(1, Math.ceil(perIpResult.retryAfterMs / 1000)),
          scope: 'ip',
        };
      }
      const globalResult = global.take('__global__', now);
      if (!globalResult.allowed) {
        return {
          allowed: false,
          retryAfterSec: Math.max(1, Math.ceil(globalResult.retryAfterMs / 1000)),
          scope: 'global',
        };
      }
      return { allowed: true, retryAfterSec: 0 };
    },
  };
}
