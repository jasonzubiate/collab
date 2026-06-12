import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api";
import { submitProposalSchema } from "@/lib/validation/proposalSchemas";
import { submitProposal } from "@/lib/services/proposalService";
import { clientIpFromRequest, rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const limit = rateLimit(`submit:${clientIpFromRequest(request)}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return jsonError("Too many requests. Try again shortly.", 429, {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = submitProposalSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await submitProposal(parsed.data.draftId, parsed.data.scope);
  if (!result.ok) {
    const status = result.reason === "DRAFT_NOT_FOUND" ? 404 : 410;
    const message =
      result.reason === "DRAFT_NOT_FOUND"
        ? "Draft not found."
        : "This session has expired. Please start again.";
    return jsonError(message, status);
  }

  return jsonOk({
    proposalId: result.proposalId,
    calculatedPayoutCents: result.calculatedPayoutCents,
    formattedPayout: result.formattedPayout,
    breakdown: result.breakdown,
    formattedBreakdown: result.formattedBreakdown,
    matchTier: result.matchTier,
  });
}
