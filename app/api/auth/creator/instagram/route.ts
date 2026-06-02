import { jsonError } from "@/lib/api";
import { appBaseUrl } from "@/lib/instagram/config";
import {
  buildCreatorAuthorizeUrl,
  exchangeCreatorCodeForProfile,
} from "@/lib/instagram/creatorOAuth";
import { findOrCreateCreatorFromInstagram } from "@/lib/services/creatorAuthService";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const signinUrl = `${appBaseUrl()}/creator/signin`;

  if (error) {
    return Response.redirect(
      `${signinUrl}?error=${encodeURIComponent(error)}`,
      302,
    );
  }

  if (!code) {
    try {
      const authorizeUrl = buildCreatorAuthorizeUrl("creator-signin");
      return Response.redirect(authorizeUrl, 302);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Instagram is not configured.";
      return jsonError(message, 500);
    }
  }

  try {
    const profile = await exchangeCreatorCodeForProfile(code);
    const { sessionToken } = await findOrCreateCreatorFromInstagram({
      igUserId: profile.igUserId,
      username: profile.username,
    });

    const completeUrl = `${appBaseUrl()}/creator/signin/complete?token=${encodeURIComponent(sessionToken)}`;
    return Response.redirect(completeUrl, 302);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Instagram signin failed.";
    return Response.redirect(
      `${signinUrl}?error=${encodeURIComponent(message)}`,
      302,
    );
  }
}
