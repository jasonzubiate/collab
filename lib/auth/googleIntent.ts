export const GOOGLE_INTENT_COOKIE = "google_oauth_intent";

export type GoogleIntent = "brand" | "creator";

export function parseGoogleIntent(value: string | undefined): GoogleIntent {
  return value === "creator" ? "creator" : "brand";
}
