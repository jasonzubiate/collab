"use client";

import { useCallback, useEffect, useState } from "react";
import { Label, ListBox, SearchField, Select, Tabs } from "@heroui/react";
import { getLocalTimeZone, type DateValue } from "@internationalized/date";
import { Button } from "@/components/ui/Button";
import { DatePickerField } from "@/components/ui/DatePickerField";
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
  const [from, setFrom] = useState<DateValue | null>(null);
  const [to, setTo] = useState<DateValue | null>(null);

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
    if (from) params.set("from", from.toDate(getLocalTimeZone()).toISOString());
    if (to) params.set("to", to.toDate(getLocalTimeZone()).toISOString());
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

      <Tabs
        className="mb-4 md:max-w-xs"
        variant="primary"
        selectedKey={tier}
        onSelectionChange={(key) => setTier(key as MatchTier)}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Match tier">
            {TIER_TABS.map((tab) => (
              <Tabs.Tab key={tab.value} id={tab.value}>
                {tab.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchField
          aria-label="Search proposals"
          className="min-w-[180px] flex-1"
          value={query}
          onChange={setQuery}
          variant="secondary"
        >
          <Label className="mb-1 block text-xs font-medium text-muted-foreground">
            Search
          </Label>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Handle, name, or email" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <Select
          aria-label="Status"
          className="w-48"
          variant="secondary"
          value={status}
          onChange={(key) => setStatus((key as WorkflowStatus | "ALL") ?? "ALL")}
        >
          <Label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {STATUS_FILTERS.map((s) => (
                <ListBox.Item key={s.value} id={s.value} textValue={s.label}>
                  {s.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {campaigns.length > 1 ? (
          <Select
            aria-label="Campaign"
            className="w-48"
            variant="secondary"
            value={campaignId || "ALL"}
            onChange={(key) =>
              setCampaignId(key === "ALL" ? "" : String(key ?? ""))
            }
          >
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">
              Campaign
            </Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="ALL" textValue="All campaigns">
                  All campaigns
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {campaigns.map((c) => (
                  <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                    {c.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        ) : null}

        <DatePickerField
          label="From"
          className="w-48"
          value={from}
          onChange={setFrom}
        />
        <DatePickerField
          label="To"
          className="w-48"
          value={to}
          onChange={setTo}
        />
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
