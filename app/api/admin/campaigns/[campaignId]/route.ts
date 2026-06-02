import { jsonError, jsonOk, requireAdmin, zodErrorResponse } from "@/lib/api";
import { updateCampaignSchema } from "@/lib/validation/campaignSchemas";
import { updateCampaign } from "@/lib/services/adminCampaignService";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/campaigns/[campaignId]">,
) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { campaignId } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await updateCampaign(admin.brandId, campaignId, parsed.data);
  if ("error" in result) {
    if (result.error === "NOT_FOUND") {
      return jsonError("Campaign not found.", 404);
    }
    return jsonError("A campaign with that slug already exists.", 409);
  }

  return jsonOk({ campaign: result.campaign });
}
