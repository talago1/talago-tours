/**
 * Fixed-window, in-memory rate limiter.
 *
 * Scope: it is a meaningful brake on credential/reference guessing, not a
 * complete control. It does NOT survive a redeploy and is per-instance, so on
 * serverless it only limits bursts hitting one instance. Treat the token-based
 * auth in the public booking lookup as the real fix; this is the belt to that
 * braces.
 *
 * Chosen over a dependency because the project has none and this is the only
 * thing it would be used for.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  // Amortised cleanup so the map cannot grow without bound.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Best-effort client identity. XFF is only as trustworthy as the proxy in front of it. */
export function clientKey(request: Request, prefix: string): string {
  const xff = request.headers.get('x-forwarded-for');
  const ip = xff?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return `${prefix}:${ip}`;
}

export function tooManyRequests(retryAfterSeconds: number) {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'retry-after': String(retryAfterSeconds),
        'cache-control': 'no-store',
      },
    },
  );
}
