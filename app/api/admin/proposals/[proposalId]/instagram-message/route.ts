import { jsonError, jsonOk, requireAdmin, zodErrorResponse } from "@/lib/api";
import { instagramReplySchema } from "@/lib/validation/proposalSchemas";
import { sendInstagramReply } from "@/lib/services/adminProposalService";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/proposals/[proposalId]/instagram-message">,
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

  const parsed = instagramReplySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await sendInstagramReply(
    admin.brandId,
    proposalId,
    parsed.data.text,
  );
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : 400;
    return jsonError(result.message, status);
  }

  return jsonOk({ ok: true });
}
