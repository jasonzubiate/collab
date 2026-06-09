/**
 * Thin wrappers over the Instagram Graph API (Instagram Login path).
 *
 * These call the real Meta endpoints using credentials/tokens supplied by the
 * caller. They throw `GraphApiError` on non-2xx so services can decide whether
 * to surface or swallow the failure. Tokens are never logged.
 */
import {
  IG_GRAPH_TOKEN_HOST,
  IG_OAUTH_TOKEN_URL,
  IG_SCOPES,
  IG_OAUTH_AUTHORIZE_URL,
  graphBaseUrl,
  oauthRedirectUri,
  requireAppCredentials,
} from "./config";

export class GraphApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GraphApiError";
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: { message?: string; error_user_msg?: string; code?: number };
      error_message?: string;
    };
    const message =
      data.error?.error_user_msg ??
      data.error?.message ??
      data.error_message ??
      `Graph API error (${res.status})`;

    if (
      data.error?.code === 100 &&
      message.toLowerCase().includes("method type")
    ) {
      return `${message} — your app is in Live mode but Graph API access for these permissions is not active yet. Submit App Review for instagram_business_basic and instagram_business_manage_messages (with business verification), or switch back to Development mode to test with app role users while review is pending.`;
    }

    return message;
  } catch {
    return `Graph API error (${res.status})`;
  }
}

/** Build the URL the admin's browser is redirected to for authorization. */
export function buildAuthorizeUrl(state: string): string {
  const { appId } = requireAppCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: oauthRedirectUri(),
    response_type: "code",
    scope: IG_SCOPES.join(","),
    state,
  });
  return `${IG_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

export type ShortLivedToken = {
  accessToken: string;
  userId: string;
};

/** Exchange the OAuth `code` for a short-lived Instagram user token. */
export async function exchangeCodeForToken(
  code: string,
): Promise<ShortLivedToken> {
  const { appId, appSecret } = requireAppCredentials();
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: oauthRedirectUri(),
    code,
  });

  const res = await fetch(IG_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new GraphApiError(await parseError(res), res.status);

  const data = (await res.json()) as {
    access_token: string;
    user_id: number | string;
  };
  return { accessToken: data.access_token, userId: String(data.user_id) };
}

export type LongLivedToken = {
  accessToken: string;
  expiresAt: Date | null;
};

/** Exchange a short-lived token for a long-lived (~60 day) token. */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<LongLivedToken> {
  const { appSecret } = requireAppCredentials();
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: appSecret,
    access_token: shortLivedToken,
  });
  // Token exchange is unversioned: graph.instagram.com/access_token (not /v21.0/).
  const res = await fetch(
    `${IG_GRAPH_TOKEN_HOST}/access_token?${params.toString()}`,
  );
  if (!res.ok) throw new GraphApiError(await parseError(res), res.status);

  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };
  const expiresAt =
    typeof data.expires_in === "number"
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;
  return { accessToken: data.access_token, expiresAt };
}

export type IgProfile = {
  igUserId: string;
  username: string | null;
};

/** Fetch the authenticated Instagram account's id + username. */
export async function fetchProfile(accessToken: string): Promise<IgProfile> {
  const params = new URLSearchParams({
    fields: "user_id,username",
    access_token: accessToken,
  });
  // Profile lookup uses the unversioned /me host for Instagram Login tokens.
  const res = await fetch(`${IG_GRAPH_TOKEN_HOST}/me?${params.toString()}`);
  if (!res.ok) throw new GraphApiError(await parseError(res), res.status);

  const data = (await res.json()) as {
    user_id?: string;
    id?: string;
    username?: string;
  };
  return {
    igUserId: String(data.user_id ?? data.id ?? ""),
    username: data.username ?? null,
  };
}

/** Subscribe the app to messaging webhooks for the connected account. */
export async function subscribeWebhooks(
  accessToken: string,
  igUserId: string,
): Promise<void> {
  const body = new URLSearchParams({
    subscribed_fields: "messages,messaging_postbacks",
    access_token: accessToken,
  });
  const res = await fetch(`${graphBaseUrl()}/${igUserId}/subscribed_apps`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new GraphApiError(await parseError(res), res.status);
}

/** Best-effort unsubscribe used on disconnect. */
export async function unsubscribeWebhooks(
  accessToken: string,
  igUserId: string,
): Promise<void> {
  const params = new URLSearchParams({ access_token: accessToken });
  const res = await fetch(
    `${graphBaseUrl()}/${igUserId}/subscribed_apps?${params.toString()}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new GraphApiError(await parseError(res), res.status);
}

/** Send a plain-text DM to a recipient IGSID using the account's token. */
export async function sendTextMessage(
  accessToken: string,
  igUserId: string,
  recipientIgsid: string,
  text: string,
): Promise<{ messageId: string | null }> {
  const res = await fetch(`${graphBaseUrl()}/${igUserId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientIgsid },
      message: { text },
    }),
  });
  if (!res.ok) throw new GraphApiError(await parseError(res), res.status);

  const data = (await res.json()) as { message_id?: string };
  return { messageId: data.message_id ?? null };
}
