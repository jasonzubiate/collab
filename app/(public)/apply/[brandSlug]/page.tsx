import {
  getActiveCampaignByBrandSlug,
  toPublicCampaign,
} from "@/lib/services/campaignService";
import { CreatorIntakeForm } from "@/components/intake/CreatorIntakeForm";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ brandSlug: string }>;
}) {
  const { brandSlug } = await params;
  const campaign = await getActiveCampaignByBrandSlug(brandSlug);

  if (!campaign) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            No open campaign
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This brand isn&apos;t accepting collaboration requests right now.
            Check back soon.
          </p>
        </div>
      </main>
    );
  }

  return (
    <CreatorIntakeForm
      brandSlug={brandSlug}
      campaign={toPublicCampaign(campaign)}
    />
  );
}
