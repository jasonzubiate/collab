/**
 * Money helpers. All persisted money lives in integer cents to avoid
 * floating-point currency drift.
 */

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format integer cents as a USD string, e.g. 85000 -> "$850.00". */
export function formatCents(cents: number): string {
  return usdFormatter.format(centsToDollars(cents));
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Compact follower formatting, e.g. 125000 -> "125K". */
export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value);
}

/** Format an engagement rate (e.g. 3.5) as a percentage string "3.5%". */
export function formatEngagementRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}
