import { verifyCreatorMagicLinkToken } from "@/lib/services/creatorAuthService";
import { appBaseUrl } from "@/lib/instagram/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const signinUrl = `${appBaseUrl()}/creator/signin`;

  if (!token) {
    return Response.redirect(`${signinUrl}?error=missing_token`, 302);
  }

  const result = await verifyCreatorMagicLinkToken(token);
  if (!result) {
    return Response.redirect(
      `${signinUrl}?error=${encodeURIComponent("This link has expired.")}`,
      302,
    );
  }

  const completeUrl = `${appBaseUrl()}/creator/signin/complete?token=${encodeURIComponent(result.sessionToken)}`;
  return Response.redirect(completeUrl, 302);
}
