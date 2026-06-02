import { jsonError, jsonOk, requireAdmin } from "@/lib/api";
import { verifyConnection } from "@/lib/services/instagramConnectionService";

/** Connection health check: confirms the stored token still resolves a profile. */
export async function POST() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const result = await verifyConnection(admin.brandId);
  if (!result.ok) return jsonError(result.error ?? "Health check failed.", 400);

  return jsonOk({ ok: true, igUsername: result.igUsername });
}
