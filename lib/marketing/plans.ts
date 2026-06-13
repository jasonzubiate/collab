import type { UserType } from "@prisma/client";

import { dashboardPath } from "@/lib/auth/dashboardPath";
import { formatCents } from "@/lib/money";

export type PlanId = "pro" | "team";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthlyCents: number;
  seats: number;
  activeCampaigns: number;
  proposalsPerMonth: number | "fair_use_unlimited";
  features: string[];
  highlighted?: boolean;
  badge?: string;
};

export const PLANS: PlanDefinition[] = [
  {
    id: "pro",
    name: "Pro",
    tagline: "Run your entire creator pipeline solo.",
    priceMonthlyCents: 5900,
    seats: 1,
    activeCampaigns: 1,
    proposalsPerMonth: 75,
    badge: "Popular",
    features: [
      "1 seat",
      "1 active campaign",
      "75 proposals per month",
      "Web intake + Instagram DMs",
      "Auto-vetting and upfront payout estimates",
      "CSV export",
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "Share triage, notes, and approvals across your marketing team.",
    priceMonthlyCents: 14900,
    seats: 5,
    activeCampaigns: 3,
    proposalsPerMonth: "fair_use_unlimited",
    features: [
      "5 seats with roles",
      "3 active campaigns",
      "300+ proposals per month",
      "Assignment and shared notes",
      "Bulk actions and teammate notifications",
      "Everything in Pro",
      "Priority support",
    ],
  },
];

export const SHARED_FEATURES = [
  "Deterministic payout estimates from your pricing rules",
  "Auto-vetting on follower and engagement thresholds",
  "Branded intake link (/apply/[brandSlug])",
  "Instagram DM intake (same pipeline as web)",
  "Proposal triage dashboard",
] as const;

export const PRICING_FOOTNOTES = [
  "14-day free trial on all plans",
  "Cancel anytime",
  "Prices in USD. Billed monthly.",
] as const;

export type ComparisonValue = string | boolean;

export type ComparisonRow = {
  label: string;
  pro: ComparisonValue;
  team: ComparisonValue;
};

export const COMPARISON_ROWS: ComparisonRow[] = [
  { label: "Monthly price", pro: "$59", team: "$149" },
  { label: "Seats", pro: "1", team: "5" },
  { label: "Active campaigns", pro: "1", team: "3" },
  {
    label: "Proposals per month",
    pro: "75",
    team: "300+",
  },
  { label: "Web intake + Instagram DMs", pro: true, team: true },
  { label: "Auto-vetting & payout estimates", pro: true, team: true },
  { label: "CSV export", pro: true, team: true },
  { label: "Roles, assignment & shared notes", pro: false, team: true },
  { label: "Bulk actions & teammate notifications", pro: false, team: true },
  { label: "Support", pro: "Email", team: "Priority email" },
];

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is there a free plan?",
    answer:
      "No. Collab is built for brands running paid creator partnerships. Every plan includes a 14-day free trial so you can test intake, DM automation, and triage before you commit.",
  },
  {
    question: "Do creators pay?",
    answer:
      "Never. Creators apply through your branded link or Instagram DMs at no cost. Collab subscriptions are for brand teams only.",
  },
  {
    question: "What counts as a proposal toward my monthly limit?",
    answer:
      "Each new creator application — whether it arrives through your web intake link or Instagram DM — counts as one proposal. Updates to an existing thread do not count again.",
  },
  {
    question: "Can I connect Instagram DMs on Pro?",
    answer:
      "Yes. Pro includes the same Instagram DM intake pipeline as Team. Connect your professional account and route inbound DMs into the same triage dashboard as web submissions.",
  },
  {
    question: "What happens if I exceed my proposal limit?",
    answer:
      "We'll notify you as you approach your monthly cap. Once billing ships, you'll be able to upgrade or wait until your cycle resets — we won't silently drop submissions without warning.",
  },
  {
    question: "Can I switch between Pro and Team later?",
    answer:
      "Yes. You can move between plans as your team grows. Seat limits, campaign caps, and proposal volume adjust to match your new tier.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "Start any plan with a 14-day free trial. You get full access to your tier's limits during the trial. Cancel anytime before it ends and you won't be charged.",
  },
];

/** Format monthly plan price without trailing .00, e.g. 5900 → "$59". */
export function formatPlanPrice(cents: number): string {
  return formatCents(cents).replace(/\.00$/, "");
}

export function formatProposalsPerMonth(
  limit: number | "fair_use_unlimited",
): string {
  if (limit === "fair_use_unlimited") return "300+";
  return String(limit);
}

export type PricingCta = {
  href: string;
  label: string;
};

export function getPricingCta(
  userType: UserType | null | undefined,
): PricingCta {
  if (userType === "BRAND") {
    return {
      href: dashboardPath("BRAND"),
      label: "Go to dashboard",
    };
  }

  return {
    href: "/brand/signup",
    label: "Get started",
  };
}
