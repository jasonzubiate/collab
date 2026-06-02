/**
 * Creator identity helpers for the DM channel (PRD section 8).
 *
 * The IGSID (Instagram-scoped user ID) is the primary contact key. While mock
 * enrichment is active and the webhook does not carry a username, we derive a
 * stable pseudo-handle (`ig_<hash>`) from the IGSID so enrichment is fully
 * automated and deterministic. Replace with the real Graph username (option A)
 * once `instagram_basic` is approved.
 */

/** FNV-1a 32-bit hash, matching the mock enricher's hashing style. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic, mock-friendly handle derived from an IGSID. */
export function pseudoHandleForIgsid(igsid: string): string {
  return `ig_${fnv1a(igsid).toString(36)}`;
}

/** True if a handle was derived from an IGSID rather than resolved from Graph. */
export function isPseudoHandle(handle: string): boolean {
  return /^ig_[0-9a-z]+$/.test(handle);
}
