import { formatCents, formatCompactNumber } from "@/lib/money";
import type { PayoutBreakdown } from "./types";

function deliverableLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * Canonical one-line breakdown string (DM-friendly).
 *
 * Example: $380.00 base (38K followers) + $500.00 reels + $75.00 story × 1.2 (30-day paid ads) = $1,146.00
 */
export function formatPayoutBreakdown(breakdown: PayoutBreakdown): string {
  const segments: string[] = [
    `${formatCents(breakdown.baseCents)} base (${formatCompactNumber(breakdown.followerCount)} followers)`,
  ];

  if (breakdown.reelsCount > 0) {
    segments.push(
      `${formatCents(breakdown.reelsCents)} ${deliverableLabel(breakdown.reelsCount, "reel", "reels")}`,
    );
  }

  if (breakdown.storiesCount > 0) {
    segments.push(
      `${formatCents(breakdown.storiesCents)} ${deliverableLabel(breakdown.storiesCount, "story", "stories")}`,
    );
  }

  let line = segments.join(" + ");

  if (breakdown.adUsageDays !== 0) {
    line += ` × ${breakdown.usageMultiplier} (${breakdown.usageLabel})`;
  }

  return `${line} = ${formatCents(breakdown.totalCents)}`;
}
