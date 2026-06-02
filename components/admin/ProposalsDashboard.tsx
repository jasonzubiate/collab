"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { ProposalTable } from "./ProposalTable";
import { ProposalDetailDrawer } from "./ProposalDetailDrawer";
import type {
  AdminCampaign,
  AdminProposal,
  MatchTier,
  WorkflowStatus,
} from "@/lib/adminTypes";

const TIER_TABS: { value: MatchTier; label: string }[] = [
  { value: "GREEN", label: "Green" },
  { value: "YELLOW", label: "Yellow" },
  { value: "ARCHIVED", label: "Archived" },
];

const STATUS_FILTERS: { value: WorkflowStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export function ProposalsDashboard({
  campaigns,
}: {
  campaigns: AdminCampaign[];
}) {
  const [tier, setTier] = useState<MatchTier>("GREEN");
  const [status, setStatus] = useState<WorkflowStatus | "ALL">("ALL");
  const [campaignId, setCampaignId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [proposals, setProposals] = useState<AdminProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminProposal | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("matchTier", tier);
    if (status !== "ALL") params.set("workflowStatus", status);
    if (campaignId) params.set("campaignId", campaignId);
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    return params;
  }, [tier, status, campaignId, debouncedQuery, from, to]);

  // Fetch whenever filters change. All state updates happen inside async
  // promise callbacks (never synchronously in the effect body) so we keep
  // stale data visible during refetch instead of flashing a skeleton.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/proposals?${buildParams().toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) setProposals(data.proposals ?? []);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setLoading(false);
      });
    return () => controller.abort();
  }, [buildParams]);

  const handleUpdated = (updated: AdminProposal) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    );
    setSelected((prev) =>
      prev && prev.id === updated.id ? { ...prev, ...updated } : prev,
    );
  };

  const exportCsv = () => {
    window.location.href = `/api/admin/proposals/export?${buildParams().toString()}`;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Proposals
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${proposals.length} in view`}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="mb-4 flex gap-1 border-b border-border">
        {TIER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTier(tab.value)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tier === tab.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Search
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Handle, name, or email"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as WorkflowStatus | "ALL")
            }
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {campaigns.length > 1 ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Campaign
            </label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <option value="">All campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
      </div>

      <ProposalTable
        proposals={proposals}
        loading={loading}
        onSelect={setSelected}
      />

      <ProposalDetailDrawer
        proposal={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
