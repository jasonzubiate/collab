"use client";

import { useState } from "react";
import { Input } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { dollarsToCents } from "@/lib/money";
import type { AdminCampaign } from "@/lib/adminTypes";

type Props = {
  campaign?: AdminCampaign;
  onSaved: (campaign: AdminCampaign) => void;
  onCancel: () => void;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CampaignSettingsForm({ campaign, onSaved, onCancel }: Props) {
  const isEdit = Boolean(campaign);
  const [name, setName] = useState(campaign?.name ?? "");
  const [slug, setSlug] = useState(campaign?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(isEdit);
  const [isActive, setIsActive] = useState(campaign?.isActive ?? false);
  const [minFollowers, setMinFollowers] = useState(
    String(campaign?.minFollowers ?? 10000),
  );
  const [minEngagementRate, setMinEngagementRate] = useState(
    String(campaign?.minEngagementRate ?? 2),
  );
  const [baseRate, setBaseRate] = useState(
    String((campaign?.baseRatePer10kCents ?? 10000) / 100),
  );
  const [reelRate, setReelRate] = useState(
    String((campaign?.ratePerReelCents ?? 25000) / 100),
  );
  const [storyRate, setStoryRate] = useState(
    String((campaign?.ratePerStoryCents ?? 7500) / 100),
  );
  const [mult30, setMult30] = useState(
    String(campaign?.adUsage30DayMultiplier ?? 1.2),
  );
  const [mult90, setMult90] = useState(
    String(campaign?.adUsage90DayMultiplier ?? 1.4),
  );

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugDirty) setSlug(slugify(value));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      isActive,
      minFollowers: Number(minFollowers),
      minEngagementRate: Number(minEngagementRate),
      baseRatePer10kCents: dollarsToCents(Number(baseRate)),
      ratePerReelCents: dollarsToCents(Number(reelRate)),
      ratePerStoryCents: dollarsToCents(Number(storyRate)),
      adUsage30DayMultiplier: Number(mult30),
      adUsage90DayMultiplier: Number(mult90),
    };

    try {
      const res = await fetch(
        isEdit
          ? `/api/admin/campaigns/${campaign!.id}`
          : "/api/admin/campaigns",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setFormError(data.error ?? "Could not save campaign.");
        return;
      }
      onSaved(data.campaign);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-border bg-surface p-5"
    >
      <h2 className="text-base font-semibold text-foreground">
        {isEdit ? "Edit campaign" : "New campaign"}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Name" errors={errors.name}>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Summer Creator Collabs"
            fullWidth
            variant="secondary"
          />
        </FormField>
        <FormField label="Public slug" errors={errors.slug} hint="/apply/<brand>">
          <Input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugDirty(true);
            }}
            placeholder="summer-creator-collabs"
            fullWidth
            variant="secondary"
          />
        </FormField>

        <FormField
          label="Min followers"
          errors={errors.minFollowers}
        >
          <Input
            type="number"
            min={0}
            value={minFollowers}
            onChange={(e) => setMinFollowers(e.target.value)}
            fullWidth
            variant="secondary"
          />
        </FormField>
        <FormField
          label="Min engagement rate (%)"
          errors={errors.minEngagementRate}
        >
          <Input
            type="number"
            min={0}
            step="0.1"
            value={minEngagementRate}
            onChange={(e) => setMinEngagementRate(e.target.value)}
            fullWidth
            variant="secondary"
          />
        </FormField>

        <FormField
          label="Base rate / 10k followers ($)"
          errors={errors.baseRatePer10kCents}
        >
          <Input
            type="number"
            min={0}
            step="0.01"
            value={baseRate}
            onChange={(e) => setBaseRate(e.target.value)}
            fullWidth
            variant="secondary"
          />
        </FormField>
        <FormField label="Rate per reel ($)" errors={errors.ratePerReelCents}>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={reelRate}
            onChange={(e) => setReelRate(e.target.value)}
            fullWidth
            variant="secondary"
          />
        </FormField>
        <FormField
          label="Rate per story ($)"
          errors={errors.ratePerStoryCents}
        >
          <Input
            type="number"
            min={0}
            step="0.01"
            value={storyRate}
            onChange={(e) => setStoryRate(e.target.value)}
            fullWidth
            variant="secondary"
          />
        </FormField>
        <div />

        <FormField
          label="30-day usage multiplier"
          errors={errors.adUsage30DayMultiplier}
        >
          <Input
            type="number"
            min={1}
            step="0.05"
            value={mult30}
            onChange={(e) => setMult30(e.target.value)}
            fullWidth
            variant="secondary"
          />
        </FormField>
        <FormField
          label="90-day usage multiplier"
          errors={errors.adUsage90DayMultiplier}
        >
          <Input
            type="number"
            min={1}
            step="0.05"
            value={mult90}
            onChange={(e) => setMult90(e.target.value)}
            fullWidth
            variant="secondary"
          />
        </FormField>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Set as the active campaign (deactivates any other)
      </label>

      {formError ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="mt-5 flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create campaign"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function FormField({
  label,
  hint,
  errors,
  children,
}: {
  label: string;
  hint?: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
        {hint ? <span className="ml-1 text-border-strong">{hint}</span> : null}
      </label>
      {children}
      {errors?.length ? (
        <p className="mt-1 text-xs text-danger">{errors[0]}</p>
      ) : null}
    </div>
  );
}
