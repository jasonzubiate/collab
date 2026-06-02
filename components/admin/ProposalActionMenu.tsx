"use client";

import { useState } from "react";
import { Label, ListBox, Select } from "@heroui/react";
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
  const [replyText, setReplyText] = useState("");
  const [replyNote, setReplyNote] = useState<string | null>(null);

  const isDm = proposal.source === "INSTAGRAM_DM";

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

  const sendInstagramReply = async () => {
    setReplyNote(null);
    const data = await run(
      "instagram",
      `/api/admin/proposals/${proposal.id}/instagram-message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText.trim() }),
      },
    );
    if (data?.ok) {
      setReplyText("");
      setReplyNote("Message sent to the creator's Instagram DM.");
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
        {isDm ? null : (
          <Button
            size="sm"
            variant="secondary"
            onClick={emailCreator}
            disabled={busy !== null || !proposal.creatorEmail}
          >
            {busy === "email" ? "…" : "Email creator"}
          </Button>
        )}
      </div>

      {isDm ? (
        <div className="space-y-2 rounded-lg border border-border bg-background p-3">
          <Label className="block text-xs font-medium text-muted-foreground">
            Message on Instagram
          </Label>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Reply to the creator in their Instagram DMs…"
            className="w-full resize-none rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Sends within Meta&apos;s 24h messaging window.
            </span>
            <Button
              size="sm"
              onClick={sendInstagramReply}
              disabled={busy !== null || replyText.trim().length === 0}
            >
              {busy === "instagram" ? "Sending…" : "Send DM"}
            </Button>
          </div>
          {replyNote ? (
            <p className="text-xs text-success" role="status">
              {replyNote}
            </p>
          ) : null}
        </div>
      ) : null}

      <Select
        aria-label="Change status manually"
        fullWidth
        variant="secondary"
        value={proposal.workflowStatus}
        isDisabled={busy !== null}
        onChange={(key) => {
          if (key) changeStatus(key as WorkflowStatus);
        }}
      >
        <Label className="mb-1 block text-xs font-medium text-muted-foreground">
          Change status manually
        </Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {statusOptions.map((status) => (
              <ListBox.Item
                key={status}
                id={status}
                textValue={status.charAt(0) + status.slice(1).toLowerCase()}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
