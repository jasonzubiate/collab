import { jsonError, jsonOk } from "@/lib/api";
import {
  getActiveCampaignByBrandSlug,
  toPublicCampaign,
} from "@/lib/services/campaignService";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/public/brands/[brandSlug]/active-campaign">,
) {
  const { brandSlug } = await ctx.params;
  const campaign = await getActiveCampaignByBrandSlug(brandSlug);

  if (!campaign) {
    return jsonError("No active campaign for this brand.", 404);
  }

  return jsonOk({ campaign: toPublicCampaign(campaign) });
}
