import { jsonError, requireAdmin } from "@/lib/api";
import { appBaseUrl } from "@/lib/instagram/config";
import { buildAuthorizeUrl } from "@/lib/instagram/graphClient";
import { completeConnection } from "@/lib/services/instagramConnectionService";

/**
 * Single endpoint for the Instagram Login OAuth flow.
 *
 * - No `code`: this is the START. Redirect the admin's browser to the Instagram
 *   authorize screen (redirect_uri points back here).
 * - With `code`: this is the CALLBACK. The same authenticated admin session is
 *   present on the top-level redirect, so we trust the session's brandId rather
 *   than the state param. `state` is still passed for CSRF defense in depth.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const url = new URL(request.url);
  // Meta appends `#_` to the callback URL; strip if it leaked into the code param.
  const code = url.searchParams.get("code")?.replace(/#_$/, "");
  const error = url.searchParams.get("error");
  const settingsUrl = `${appBaseUrl()}/admin/settings/instagram`;

  if (error) {
    return Response.redirect(
      `${settingsUrl}?error=${encodeURIComponent(error)}`,
      302,
    );
  }

  if (!code) {
    try {
      const authorizeUrl = buildAuthorizeUrl(`brand:${admin.brandId}`);
      return Response.redirect(authorizeUrl, 302);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Instagram is not configured.";
      return jsonError(message, 500);
    }
  }

  const result = await completeConnection(admin.brandId, code);
  if (!result.ok) {
    return Response.redirect(
      `${settingsUrl}?error=${encodeURIComponent(result.error)}`,
      302,
    );
  }

  return Response.redirect(`${settingsUrl}?connected=1`, 302);
}
