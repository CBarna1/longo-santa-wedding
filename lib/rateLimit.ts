/**
 * Fixed-window rate limiter keyed by client IP.
 *
 * In-memory, so on Vercel each warm function instance keeps its own counts.
 * That is enough to stop a single script from draining the Gmail daily send
 * quota through one instance, without adding an external store.
 * `now` is injectable so the logic can be unit-tested.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; start: number }>();

  return function allow(key: string, now: number = Date.now()): boolean {
    const entry = hits.get(key);
    if (!entry || now - entry.start >= windowMs) {
      hits.set(key, { count: 1, start: now });
      // Drop expired entries occasionally so the map can't grow without bound.
      if (hits.size > 1000) {
        for (const [k, v] of hits) if (now - v.start >= windowMs) hits.delete(k);
      }
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  };
}
