import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listCampaigns } from "@/lib/services/adminCampaignService";
import { CampaignsManager } from "@/components/admin/CampaignsManager";

export default async function CampaignsPage() {
  const session = await auth();
  if (!session?.user?.brandId) redirect("/login");

  const campaigns = await listCampaigns(session.user.brandId);

  return <CampaignsManager initialCampaigns={campaigns} />;
}
