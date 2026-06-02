import { jsonError, jsonOk, requireAdmin } from "@/lib/api";
import { buildEmailIntent } from "@/lib/services/adminProposalService";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/admin/proposals/[proposalId]/email">,
) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { proposalId } = await ctx.params;
  const result = await buildEmailIntent(admin.brandId, proposalId);
  if ("error" in result) return jsonError("Proposal not found.", 404);

  return jsonOk({ mailto: result.mailto, creatorEmail: result.creatorEmail });
}
