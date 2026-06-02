import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signinPath } from "@/lib/auth/dashboardPath";
import { listCampaigns } from "@/lib/services/adminCampaignService";
import { ProposalsDashboard } from "@/components/admin/ProposalsDashboard";

export default async function ProposalsPage() {
  const session = await auth();
  if (!session?.user?.brandId) redirect(signinPath("BRAND"));

  const campaigns = await listCampaigns(session.user.brandId);

  return <ProposalsDashboard campaigns={campaigns} />;
}
