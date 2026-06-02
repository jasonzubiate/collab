"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { AdminProposal, WorkflowStatus } from "@/lib/adminTypes";

type Props = {
  proposal: AdminProposal;
  onUpdated: (proposal: AdminProposal) => void;
};

const statusOptions: WorkflowStatus[] = [
  "NEW",
  "CONTACTED",
  "APPROVED",
  "REJECTED",
];

export function ProposalActionMenu({ proposal, onUpdated }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (key: string, url: string, options?: RequestInit) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return null;
      }
      return data;
    } catch {
      setError("Network error.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const action = async (key: string, path: string) => {
    const data = await run(key, `/api/admin/proposals/${proposal.id}/${path}`, {
      method: "POST",
    });
    if (data?.proposal) onUpdated(data.proposal);
  };

  const changeStatus = async (status: WorkflowStatus) => {
    const data = await run("status", `/api/admin/proposals/${proposal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowStatus: status }),
    });
    if (data?.proposal) onUpdated(data.proposal);
  };

  const emailCreator = async () => {
    const data = await run("email", `/api/admin/proposals/${proposal.id}/email`, {
      method: "POST",
    });
    if (data?.mailto) {
      window.location.href = data.mailto;
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          onClick={() => action("approve", "approve")}
          disabled={busy !== null || proposal.workflowStatus === "APPROVED"}
        >
          {busy === "approve" ? "…" : "Approve"}
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => action("reject", "reject")}
          disabled={busy !== null || proposal.workflowStatus === "REJECTED"}
        >
          {busy === "reject" ? "…" : "Reject"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => action("contacted", "mark-contacted")}
          disabled={busy !== null}
        >
          {busy === "contacted" ? "…" : "Mark contacted"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={emailCreator}
          disabled={busy !== null}
        >
          {busy === "email" ? "…" : "Email creator"}
        </Button>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Change status manually
        </label>
        <select
          value={proposal.workflowStatus}
          onChange={(e) => changeStatus(e.target.value as WorkflowStatus)}
          disabled={busy !== null}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
