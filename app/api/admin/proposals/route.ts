import { jsonOk, requireAdmin, zodErrorResponse } from "@/lib/api";
import { proposalFiltersSchema } from "@/lib/validation/proposalSchemas";
import { listProposals } from "@/lib/services/adminProposalService";

function parseFilters(request: Request) {
  const params = new URL(request.url).searchParams;
  const raw: Record<string, string> = {};
  for (const key of ["matchTier", "workflowStatus", "campaignId", "q", "from", "to"]) {
    const value = params.get(key);
    if (value) raw[key] = value;
  }
  return proposalFiltersSchema.safeParse(raw);
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const parsed = parseFilters(request);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const proposals = await listProposals(admin.brandId, parsed.data);
  return jsonOk({ proposals });
}
