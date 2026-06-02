import { jsonOk, requireCreator } from "@/lib/api";
import { listCreatorProposals } from "@/lib/services/creatorProposalService";

export async function GET() {
  const creator = await requireCreator();
  if (creator instanceof Response) return creator;

  const proposals = await listCreatorProposals(creator.userId);
  return jsonOk({ proposals });
}
