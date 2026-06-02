import {
  IG_OAUTH_AUTHORIZE_URL,
  IG_OAUTH_TOKEN_URL,
  appBaseUrl,
  graphBaseUrl,
  requireAppCredentials,
} from "./config";
import {
  exchangeCodeForToken,
  fetchProfile,
  type IgProfile,
} from "./graphClient";

/** Scopes for creator identity login (no messaging). */
export const CREATOR_IG_SCOPES = ["instagram_business_basic"] as const;

export function creatorOAuthRedirectUri(): string {
  return (
    process.env.META_CREATOR_OAUTH_REDIRECT_URI ??
    `${appBaseUrl()}/api/auth/creator/instagram`
  );
}

export function buildCreatorAuthorizeUrl(state: string): string {
  const { appId } = requireAppCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: creatorOAuthRedirectUri(),
    response_type: "code",
    scope: CREATOR_IG_SCOPES.join(","),
    state,
  });
  return `${IG_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCreatorCodeForProfile(
  code: string,
): Promise<IgProfile & { accessToken: string }> {
  const { appId, appSecret } = requireAppCredentials();
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: creatorOAuthRedirectUri(),
    code,
  });

  const res = await fetch(IG_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error("Instagram authorization failed.");
  }

  const data = (await res.json()) as {
    access_token: string;
    user_id: number | string;
  };
  const profile = await fetchProfile(data.access_token);
  return {
    ...profile,
    igUserId: profile.igUserId || String(data.user_id),
    accessToken: data.access_token,
  };
}

export { graphBaseUrl };
