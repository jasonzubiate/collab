import { jsonError, jsonOk, requireAdmin } from "@/lib/api";
import { applyWorkflowAction } from "@/lib/services/adminProposalService";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/admin/proposals/[proposalId]/approve">,
) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { proposalId } = await ctx.params;
  const result = await applyWorkflowAction(admin.brandId, proposalId, "approve");
  if ("error" in result) return jsonError("Proposal not found.", 404);

  return jsonOk({ proposal: result.proposal });
}
