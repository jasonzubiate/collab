import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api";
import { estimateSchema } from "@/lib/validation/proposalSchemas";
import { estimateProposal } from "@/lib/services/proposalService";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = estimateSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await estimateProposal(parsed.data.draftId, parsed.data.scope);
  if (!result.ok) {
    const status = result.reason === "DRAFT_NOT_FOUND" ? 404 : 410;
    const message =
      result.reason === "DRAFT_NOT_FOUND"
        ? "Draft not found."
        : "This session has expired. Please start again.";
    return jsonError(message, status);
  }

  return jsonOk({
    calculatedPayoutCents: result.calculatedPayoutCents,
    formattedPayout: result.formattedPayout,
    matchTier: result.matchTier,
  });
}
