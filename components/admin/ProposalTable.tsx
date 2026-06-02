"use client";

import { Table } from "@heroui/react";
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
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Proposals"
          className="min-w-[640px]"
          onRowAction={(key) => {
            const proposal = proposals.find((p) => p.id === key);
            if (proposal) onSelect(proposal);
          }}
        >
          <Table.Header>
            <Table.Column isRowHeader>Creator</Table.Column>
            <Table.Column className="text-end">Followers</Table.Column>
            <Table.Column className="hidden text-end sm:table-cell">
              Engagement
            </Table.Column>
            <Table.Column className="hidden text-center md:table-cell">
              Deliverables
            </Table.Column>
            <Table.Column className="text-end">Payout</Table.Column>
            <Table.Column>Status</Table.Column>
          </Table.Header>
          <Table.Body>
            {proposals.map((proposal) => (
              <Table.Row key={proposal.id} id={proposal.id}>
                <Table.Cell>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    @{proposal.creatorHandle}
                    {proposal.source === "INSTAGRAM_DM" ? (
                      <span
                        title="Via Instagram DM"
                        className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        DM
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {proposal.creatorName ??
                      proposal.creatorEmail ??
                      "Instagram DM"}
                  </div>
                </Table.Cell>
                <Table.Cell className="tabular-nums text-end text-foreground">
                  {formatCompactNumber(proposal.followerCount)}
                </Table.Cell>
                <Table.Cell className="tabular-nums hidden text-end text-foreground sm:table-cell">
                  {formatEngagementRate(proposal.engagementRate)}
                </Table.Cell>
                <Table.Cell className="tabular-nums hidden text-center text-muted-foreground md:table-cell">
                  {proposal.reelsCount}R · {proposal.storiesCount}S
                </Table.Cell>
                <Table.Cell className="tabular-nums text-end font-medium text-foreground">
                  {formatCents(proposal.calculatedPayoutCents)}
                </Table.Cell>
                <Table.Cell>
                  <StatusBadge status={proposal.workflowStatus} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
