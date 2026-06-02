"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCents } from "@/lib/money";
import type { CreatorProposalSummary } from "@/lib/services/creatorProposalService";
import { ProposalActivityTimeline } from "./ProposalActivityTimeline";

function SourceLabel({ source }: { source: "WEB" | "INSTAGRAM_DM" }) {
  if (source === "INSTAGRAM_DM") {
    return (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        Via Instagram DM
      </span>
    );
  }
  return (
    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Web intake
    </span>
  );
}

export function CreatorRequestsList({
  proposals,
}: {
  proposals: CreatorProposalSummary[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    proposals[0]?.id ?? null,
  );

  if (proposals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          No requests yet
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          When you submit a collab request—or message a brand on Instagram—your
          proposals will appear here.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/creator/settings"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            Link Instagram in settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => {
        const expanded = expandedId === proposal.id;
        return (
          <article
            key={proposal.id}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5"
              onClick={() =>
                setExpandedId(expanded ? null : proposal.id)
              }
              aria-expanded={expanded}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    {proposal.brandName}
                  </h2>
                  <SourceLabel source={proposal.source} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {proposal.campaignName} · @{proposal.creatorHandle}
                </p>
                <p className="mt-2 text-sm tabular-nums text-foreground">
                  Est. {formatCents(proposal.calculatedPayoutCents)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <StatusBadge status={proposal.workflowStatus} />
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={proposal.createdAt}
                >
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(proposal.createdAt))}
                </time>
              </div>
            </button>

            {expanded ? (
              <div className="border-t border-border px-4 py-4 sm:px-5">
                <h3 className="text-sm font-medium text-foreground">
                  Activity
                </h3>
                <div className="mt-3">
                  <ProposalActivityTimeline
                    activity={proposal.activity}
                    instagramUsername={proposal.instagramUsername}
                  />
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
