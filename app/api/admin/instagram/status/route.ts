import { jsonOk, requireAdmin } from "@/lib/api";
import { getStatus } from "@/lib/services/instagramConnectionService";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const status = await getStatus(admin.brandId);
  return jsonOk(status);
}
