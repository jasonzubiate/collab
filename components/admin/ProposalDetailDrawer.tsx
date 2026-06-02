"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StatusBadge, TierBadge } from "@/components/ui/StatusBadge";
import { ProposalActionMenu } from "./ProposalActionMenu";
import {
  formatCents,
  formatCompactNumber,
  formatEngagementRate,
} from "@/lib/money";
import type { AdminProposal } from "@/lib/adminTypes";

function usageLabel(days: number): string {
  if (days === 30) return "30 days paid ads";
  if (days === 90) return "90 days paid ads";
  return "No ad usage";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ProposalDetailDrawer({
  proposal,
  onClose,
  onUpdated,
}: {
  proposal: AdminProposal | null;
  onClose: () => void;
  onUpdated: (proposal: AdminProposal) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (proposal) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [proposal, onClose]);

  return (
    <AnimatePresence>
      {proposal ? (
        <>
          <motion.div
            className="fixed inset-0 z-20 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col overflow-y-auto border-l border-border bg-surface shadow-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            role="dialog"
            aria-label={`Proposal from ${proposal.creatorHandle}`}
          >
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  @{proposal.creatorHandle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {proposal.creatorName ?? "—"} · {proposal.creatorEmail}
                </p>
                <div className="mt-2 flex gap-2">
                  <TierBadge tier={proposal.matchTier} />
                  <StatusBadge status={proposal.workflowStatus} />
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl bg-foreground p-4 text-white">
                <span className="text-xs uppercase tracking-wide text-white/60">
                  Calculated payout
                </span>
                <p className="tabular-nums mt-1 text-3xl font-semibold">
                  {formatCents(proposal.calculatedPayoutCents)}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Detail
                  label="Followers"
                  value={formatCompactNumber(proposal.followerCount)}
                />
                <Detail
                  label="Engagement"
                  value={formatEngagementRate(proposal.engagementRate)}
                />
                <Detail label="Reels" value={String(proposal.reelsCount)} />
                <Detail label="Stories" value={String(proposal.storiesCount)} />
                <Detail
                  label="Usage rights"
                  value={usageLabel(proposal.adUsageDays)}
                />
                <Detail label="Campaign" value={proposal.campaign.name} />
                <Detail
                  label="Submitted"
                  value={formatDate(proposal.createdAt)}
                />
                {proposal.contactedAt ? (
                  <Detail
                    label="Contacted"
                    value={formatDate(proposal.contactedAt)}
                  />
                ) : null}
              </dl>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  Actions
                </h3>
                <ProposalActionMenu proposal={proposal} onUpdated={onUpdated} />
              </div>

              {proposal.events && proposal.events.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    History
                  </h3>
                  <ul className="space-y-2">
                    {proposal.events.map((event) => (
                      <li
                        key={event.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-foreground">
                          {event.type.replace(/_/g, " ").toLowerCase()}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDate(event.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}
