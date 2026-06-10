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
 * Phase B feature flag: free-text scope parsing via an LLM. Off by default so
 * the numeric slot-filling flow is unchanged until explicitly enabled. Truthy
 * values: "1" or "true".
 */
export function llmScopeEnabled(): boolean {
  const value = process.env.IG_LLM_SCOPE_ENABLED;
  return value === "1" || value === "true";
}

/**
 * Which scope-parser provider to use: "mock" (default, deterministic/offline)
 * or "llm" (the OpenAI-compatible HTTP provider). Mirrors enrichment provider
 * selection.
 */
export function scopeParserProvider(): string {
  return process.env.SCOPE_PARSER_PROVIDER ?? "mock";
}

/** Vercel AI Gateway — OpenAI-compatible chat-completions endpoint. */
export const LLM_API_BASE_URL = "https://ai-gateway.vercel.sh/v1";

/**
 * Scope-parser model via AI Gateway. gpt-4o-mini: fast, cheap, reliable JSON
 * mode for simple slot extraction under the DM timeout budget.
 */
export const LLM_MODEL = "openai/gpt-4o-mini";

/** Vercel AI Gateway API key for the scope-parser LLM provider. */
export function llmApiKey(): string | undefined {
  return process.env.LLM_API_KEY;
}

/** Hard timeout (ms) for an LLM request before we abort and fall back. */
export function llmTimeoutMs(): number {
  const raw = Number(process.env.LLM_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 4000;
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
