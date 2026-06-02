"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatCents,
  formatCompactNumber,
  formatEngagementRate,
} from "@/lib/money";
import type { AdminProposal } from "@/lib/adminTypes";

export function ProposalTable({
  proposals,
  loading,
  onSelect,
}: {
  proposals: AdminProposal[];
  loading: boolean;
  onSelect: (proposal: AdminProposal) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0"
          >
            <div className="h-4 w-32 animate-pulse rounded bg-surface-muted" />
            <div className="ml-auto h-4 w-16 animate-pulse rounded bg-surface-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">No proposals</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing matches these filters yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Creator</th>
            <th className="px-4 py-2.5 text-right font-medium">Followers</th>
            <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">
              Engagement
            </th>
            <th className="hidden px-4 py-2.5 text-center font-medium md:table-cell">
              Deliverables
            </th>
            <th className="px-4 py-2.5 text-right font-medium">Payout</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => (
            <tr
              key={proposal.id}
              onClick={() => onSelect(proposal)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(proposal);
                }
              }}
              className="cursor-pointer border-b border-border outline-none transition-colors last:border-0 hover:bg-surface-muted focus-visible:bg-surface-muted"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">
                  @{proposal.creatorHandle}
                </div>
                <div className="text-xs text-muted-foreground">
                  {proposal.creatorName ?? proposal.creatorEmail}
                </div>
              </td>
              <td className="tabular-nums px-4 py-3 text-right text-foreground">
                {formatCompactNumber(proposal.followerCount)}
              </td>
              <td className="tabular-nums hidden px-4 py-3 text-right text-foreground sm:table-cell">
                {formatEngagementRate(proposal.engagementRate)}
              </td>
              <td className="tabular-nums hidden px-4 py-3 text-center text-muted-foreground md:table-cell">
                {proposal.reelsCount}R · {proposal.storiesCount}S
              </td>
              <td className="tabular-nums px-4 py-3 text-right font-medium text-foreground">
                {formatCents(proposal.calculatedPayoutCents)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={proposal.workflowStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
