import { jsonOk, requireAdmin } from "@/lib/api";
import { disconnect } from "@/lib/services/instagramConnectionService";

export async function DELETE() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  await disconnect(admin.brandId);
  return jsonOk({ connected: false });
}
