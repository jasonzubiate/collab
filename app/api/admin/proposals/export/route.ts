import { requireAdmin, zodErrorResponse } from "@/lib/api";
import { proposalFiltersSchema } from "@/lib/validation/proposalSchemas";
import { listProposals } from "@/lib/services/adminProposalService";
import { proposalsToCsv } from "@/lib/csv/exportProposals";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const params = new URL(request.url).searchParams;
  const raw: Record<string, string> = {};
  for (const key of ["matchTier", "workflowStatus", "campaignId", "q", "from", "to"]) {
    const value = params.get(key);
    if (value) raw[key] = value;
  }
  const parsed = proposalFiltersSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const proposals = await listProposals(admin.brandId, parsed.data);
  const csv = proposalsToCsv(proposals);
  const filename = `proposals-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
