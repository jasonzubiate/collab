"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ConnectionStatus } from "@/lib/services/instagramConnectionService";

export function InstagramConnectionPanel({
  initialStatus,
  notice,
}: {
  initialStatus: ConnectionStatus;
  notice?: { type: "connected" | "error"; message: string } | null;
}) {
  const [status, setStatus] = useState<ConnectionStatus>(initialStatus);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    notice ? notice.message : null,
  );
  const [messageType, setMessageType] = useState<"ok" | "error">(
    notice?.type === "error" ? "error" : "ok",
  );

  const startConnect = () => {
    window.location.href = "/api/admin/instagram/connect";
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect Instagram? This stops DM automation.")) {
      return;
    }
    setBusy("disconnect");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/instagram/disconnect", {
        method: "DELETE",
      });
      if (res.ok) {
        setStatus({ connected: false });
        setMessageType("ok");
        setMessage("Instagram disconnected.");
      } else {
        const data = await res.json().catch(() => ({}));
        setMessageType("error");
        setMessage(data.error ?? "Failed to disconnect.");
      }
    } finally {
      setBusy(null);
    }
  };

  const testConnection = async () => {
    setBusy("test");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/instagram/test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessageType("ok");
        setMessage(
          data.igUsername
            ? `Connection healthy — authorized as @${data.igUsername}.`
            : "Connection healthy.",
        );
      } else {
        setMessageType("error");
        setMessage(data.error ?? "Health check failed.");
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-xl rounded-xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-foreground">
        Instagram DM channel
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect your Instagram Professional account so creators who DM you can
        get an automated collab estimate. Replies are automated and disclosed to
        the creator.
      </p>

      <div className="mt-5 rounded-lg border border-border bg-background p-4">
        {status.connected ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2 rounded-full bg-success"
                />
                <span className="text-sm font-medium text-foreground">
                  Connected
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {status.igUsername ? `@${status.igUsername}` : status.igUserId}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Webhooks:{" "}
                {status.webhookSubscribed ? "subscribed" : "not subscribed"}
                {status.tokenExpiresAt
                  ? ` · token expires ${new Date(status.tokenExpiresAt).toLocaleDateString()}`
                  : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Not connected
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {status.connected ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={testConnection}
              disabled={busy !== null}
            >
              {busy === "test" ? "Checking…" : "Test connection"}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={disconnect}
              disabled={busy !== null}
            >
              {busy === "disconnect" ? "…" : "Disconnect"}
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={startConnect}>
            Connect Instagram
          </Button>
        )}
      </div>

      {message ? (
        <p
          className={
            messageType === "error"
              ? "mt-3 text-xs text-danger"
              : "mt-3 text-xs text-success"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
