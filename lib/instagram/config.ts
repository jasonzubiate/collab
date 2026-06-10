/**
 * Central env + endpoint config for the Instagram DM channel.
 *
 * Uses the "Instagram API with Instagram Login" path (no Facebook Page): the
 * brand authorizes their Instagram Professional account directly and we hold an
 * Instagram user access token. Permission/endpoint names change over time —
 * verify against current Meta docs at build time (PRD section 11).
 */

export const IG_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
] as const;

export function graphApiVersion(): string {
  return process.env.IG_GRAPH_API_VERSION ?? "v25.0";
}

export function graphBaseUrl(): string {
  return `https://graph.instagram.com/${graphApiVersion()}`;
}

/** Unversioned host for token exchange/refresh (not under /vX.Y/). */
export const IG_GRAPH_TOKEN_HOST = "https://graph.instagram.com";

/** Host used for the OAuth code exchange (distinct from the graph host). */
export const IG_OAUTH_TOKEN_URL = "https://api.instagram.com/oauth/access_token";

/** User-facing authorize screen. */
export const IG_OAUTH_AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";

export function appBaseUrl(): string {
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}

export function oauthRedirectUri(): string {
  return (
    process.env.META_OAUTH_REDIRECT_URI ??
    `${appBaseUrl()}/api/admin/instagram/connect`
  );
}

export function webhookVerifyToken(): string | undefined {
  return process.env.IG_WEBHOOK_VERIFY_TOKEN;
}

export function appSecret(): string | undefined {
  return process.env.META_APP_SECRET;
}

/**
 * Feature flag for rich DM replies (tappable quick replies + button templates).
 * Off by default so the channel ships with plain-text/numeric replies and can be
 * rolled back instantly. Truthy values: "1" or "true".
 */
export function richRepliesEnabled(): boolean {
  const value = process.env.IG_RICH_REPLIES_ENABLED;
  return value === "1" || value === "true";
}

/**
 * Returns the configured Meta app credentials, throwing if missing. Callers in
 * route handlers should catch and surface a clear "Instagram is not configured"
 * error rather than a 500.
 */
export function requireAppCredentials(): { appId: string; appSecret: string } {
  const appId = process.env.META_APP_ID;
  const secret = process.env.META_APP_SECRET;
  if (!appId || !secret) {
    throw new Error(
      "Instagram is not configured. Set META_APP_ID and META_APP_SECRET.",
    );
  }
  return { appId, appSecret: secret };
}
