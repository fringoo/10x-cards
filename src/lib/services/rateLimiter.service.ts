export const WINDOW_SIZE_IN_MS = 60_000;
export const MAX_REQUESTS = 5;

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Checks if a given key (e.g., user ID) is within rate limits.
 * Returns true if allowed, false if rate limit exceeded.
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key) ?? { timestamps: [] };
  // Remove timestamps older than window
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < WINDOW_SIZE_IN_MS);
  if (entry.timestamps.length >= MAX_REQUESTS) {
    // Rate limit exceeded
    rateLimitMap.set(key, entry);
    return false;
  }
  // Record current request timestamp
  entry.timestamps.push(now);
  rateLimitMap.set(key, entry);
  return true;
}
