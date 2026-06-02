"use client";

import { useState } from "react";
import { Chip } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { CampaignSettingsForm } from "./CampaignSettingsForm";
import { formatCents } from "@/lib/money";
import type { AdminCampaign } from "@/lib/adminTypes";

type Editing = { mode: "create" } | { mode: "edit"; campaign: AdminCampaign };

export function CampaignsManager({
  initialCampaigns,
}: {
  initialCampaigns: AdminCampaign[];
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const upsertCampaign = (saved: AdminCampaign) => {
    setCampaigns((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      const next = exists
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [saved, ...prev];
      // If the saved one became active, reflect deactivation of others.
      return saved.isActive
        ? next.map((c) =>
            c.id === saved.id ? c : { ...c, isActive: false },
          )
        : next;
    });
    setEditing(null);
  };

  const activate = async (id: string) => {
    setActivatingId(id);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/activate`, {
        method: "POST",
      });
      if (res.ok) {
        setCampaigns((prev) =>
          prev.map((c) => ({ ...c, isActive: c.id === id })),
        );
      }
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Campaigns
          </h1>
          <p className="text-sm text-muted-foreground">
            One campaign can be active for creator intake at a time.
          </p>
        </div>
        {!editing ? (
          <Button size="sm" onClick={() => setEditing({ mode: "create" })}>
            New campaign
          </Button>
        ) : null}
      </div>

      {editing ? (
        <div className="mb-6">
          <CampaignSettingsForm
            campaign={editing.mode === "edit" ? editing.campaign : undefined}
            onSaved={upsertCampaign}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : null}

      {campaigns.length === 0 && !editing ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="text-sm font-medium text-foreground">No campaigns yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first campaign to start collecting proposals.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {campaign.name}
                    </h3>
                    {campaign.isActive ? (
                      <Chip color="success" variant="soft" size="sm">
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full bg-current"
                        />
                        <Chip.Label>Active</Chip.Label>
                      </Chip>
                    ) : null}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    /apply/{campaign.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!campaign.isActive ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => activate(campaign.id)}
                      disabled={activatingId !== null}
                    >
                      {activatingId === campaign.id ? "…" : "Activate"}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing({ mode: "edit", campaign })}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Stat
                  label="Min followers"
                  value={campaign.minFollowers.toLocaleString()}
                />
                <Stat
                  label="Min engagement"
                  value={`${campaign.minEngagementRate.toFixed(1)}%`}
                />
                <Stat
                  label="Base / 10k"
                  value={formatCents(campaign.baseRatePer10kCents)}
                />
                <Stat
                  label="Per reel"
                  value={formatCents(campaign.ratePerReelCents)}
                />
                <Stat
                  label="Per story"
                  value={formatCents(campaign.ratePerStoryCents)}
                />
                <Stat
                  label="30d usage"
                  value={`${campaign.adUsage30DayMultiplier.toFixed(2)}x`}
                />
                <Stat
                  label="90d usage"
                  value={`${campaign.adUsage90DayMultiplier.toFixed(2)}x`}
                />
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tabular-nums mt-0.5 font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}
