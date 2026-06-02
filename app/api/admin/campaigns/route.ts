import { jsonError, jsonOk, requireAdmin, zodErrorResponse } from "@/lib/api";
import { createCampaignSchema } from "@/lib/validation/campaignSchemas";
import {
  createCampaign,
  listCampaigns,
} from "@/lib/services/adminCampaignService";

export async function GET() {
  const ctx = await requireAdmin();
  if (ctx instanceof Response) return ctx;

  const campaigns = await listCampaigns(ctx.brandId);
  return jsonOk({ campaigns });
}

export async function POST(request: Request) {
  const ctx = await requireAdmin();
  if (ctx instanceof Response) return ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await createCampaign(ctx.brandId, parsed.data);
  if ("error" in result) {
    return jsonError("A campaign with that slug already exists.", 409);
  }

  return jsonOk({ campaign: result.campaign }, { status: 201 });
}
