import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signinPath } from "@/lib/auth/dashboardPath";
import { listCampaigns } from "@/lib/services/adminCampaignService";
import { CampaignsManager } from "@/components/admin/CampaignsManager";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.brandId) redirect(signinPath("BRAND"));

  const campaigns = await listCampaigns(session.user.brandId);
  const params = await searchParams;

  return (
    <CampaignsManager
      initialCampaigns={campaigns}
      showOnboarding={params.onboarding === "1" && campaigns.length === 0}
    />
  );
}
