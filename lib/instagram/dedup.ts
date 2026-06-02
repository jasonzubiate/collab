/**
 * In-memory message-id dedup (PRD section 11). Instagram can redeliver webhook
 * events; we drop messages whose `mid` we've already seen.
 *
 * This is per-instance (like `lib/rateLimit.ts`) and resets on redeploy. It is a
 * best-effort guard, not a durable idempotency store — combine with the
 * per-conversation version check in the state machine for correctness.
 */
const MAX_ENTRIES = 5000;
const seen = new Set<string>();

/** Returns true the first time a mid is seen, false on subsequent duplicates. */
export function markMidSeen(mid: string): boolean {
  if (seen.has(mid)) return false;
  seen.add(mid);
  if (seen.size > MAX_ENTRIES) {
    // Drop the oldest entry (insertion order) to bound memory.
    const oldest = seen.values().next().value;
    if (oldest !== undefined) seen.delete(oldest);
  }
  return true;
}

/** Test helper. */
export function _resetDedup(): void {
  seen.clear();
}
