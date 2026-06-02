import { jsonError, jsonOk, requireAdmin, zodErrorResponse } from "@/lib/api";
import { updateProposalSchema } from "@/lib/validation/proposalSchemas";
import {
  getProposal,
  updateProposal,
} from "@/lib/services/adminProposalService";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/admin/proposals/[proposalId]">,
) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { proposalId } = await ctx.params;
  const proposal = await getProposal(admin.brandId, proposalId);
  if (!proposal) return jsonError("Proposal not found.", 404);

  return jsonOk({ proposal });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/proposals/[proposalId]">,
) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { proposalId } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = updateProposalSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await updateProposal(admin.brandId, proposalId, parsed.data);
  if ("error" in result) return jsonError("Proposal not found.", 404);

  return jsonOk({ proposal: result.proposal });
}
