import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api";
import { startProposalSchema } from "@/lib/validation/proposalSchemas";
import { startProposalDraft } from "@/lib/services/proposalService";
import { clientIpFromRequest, rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const limit = rateLimit(`start:${clientIpFromRequest(request)}`, {
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

  const parsed = startProposalSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await startProposalDraft(parsed.data);
  if (!result.ok) {
    return jsonError("No active campaign for this brand.", 404);
  }

  return jsonOk({
    draftId: result.draftId,
    campaign: result.campaign,
    metrics: result.metrics,
    gatekeeper: result.gatekeeper,
  });
}
