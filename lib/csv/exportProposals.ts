import { centsToDollars } from "@/lib/money";
import type { SerializedProposal } from "@/lib/services/adminProposalService";

const COLUMNS: { header: string; value: (p: SerializedProposal) => string }[] =
  [
    { header: "Proposal ID", value: (p) => p.id },
    { header: "Campaign", value: (p) => p.campaign.name },
    { header: "Source", value: (p) => p.source },
    {
      header: "Instagram User ID",
      value: (p) => p.instagramScopedUserId ?? "",
    },
    { header: "Handle", value: (p) => p.creatorHandle },
    { header: "Name", value: (p) => p.creatorName ?? "" },
    { header: "Email", value: (p) => p.creatorEmail ?? "" },
    { header: "Followers", value: (p) => String(p.followerCount) },
    {
      header: "Engagement Rate (%)",
      value: (p) => p.engagementRate.toFixed(2),
    },
    { header: "Reels", value: (p) => String(p.reelsCount) },
    { header: "Stories", value: (p) => String(p.storiesCount) },
    { header: "Ad Usage (days)", value: (p) => String(p.adUsageDays) },
    {
      header: "Payout (USD)",
      value: (p) => centsToDollars(p.calculatedPayoutCents).toFixed(2),
    },
    { header: "Match Tier", value: (p) => p.matchTier },
    { header: "Workflow Status", value: (p) => p.workflowStatus },
    { header: "Contacted At", value: (p) => p.contactedAt ?? "" },
    { header: "Approved At", value: (p) => p.approvedAt ?? "" },
    { header: "Rejected At", value: (p) => p.rejectedAt ?? "" },
    { header: "Created At", value: (p) => p.createdAt },
  ];

/**
 * Escape a value for CSV and neutralize spreadsheet formula injection.
 * Cells starting with = + - @ (or control chars) are prefixed with a single
 * quote so spreadsheet apps treat them as text.
 */
function sanitizeCell(raw: string): string {
  let value = raw ?? "";
  if (/^[=+\-@\t\r]/.test(value)) {
    value = `'${value}`;
  }
  if (/[",\n\r]/.test(value)) {
    value = `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function proposalsToCsv(proposals: SerializedProposal[]): string {
  const headerRow = COLUMNS.map((c) => sanitizeCell(c.header)).join(",");
  const rows = proposals.map((proposal) =>
    COLUMNS.map((c) => sanitizeCell(c.value(proposal))).join(","),
  );
  return [headerRow, ...rows].join("\r\n");
}
