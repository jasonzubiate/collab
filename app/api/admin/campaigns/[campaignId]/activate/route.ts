import { jsonError, jsonOk, requireAdmin } from "@/lib/api";
import { activateCampaign } from "@/lib/services/adminCampaignService";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/admin/campaigns/[campaignId]/activate">,
) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { campaignId } = await ctx.params;
  const result = await activateCampaign(admin.brandId, campaignId);
  if ("error" in result) {
    return jsonError("Campaign not found.", 404);
  }

  return jsonOk({ campaign: result.campaign });
}
