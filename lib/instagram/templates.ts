/**
 * Fixed DM copy (PRD section 13). No admin editor in v1.
 *
 * The `welcome` template carries the required automation disclosure and the
 * STOP opt-out (PRD section 6). Placeholders are `{{key}}`.
 */

export type TemplateKey =
  | "welcome"
  | "no_active_campaign"
  | "stopped"
  | "enriching"
  | "ineligible"
  | "ask_reels"
  | "ask_stories"
  | "ask_usage"
  | "estimate"
  | "submitted_qualified"
  | "submitted_archived"
  | "invalid_input"
  | "session_expired";

const TEMPLATES: Record<TemplateKey, string> = {
  welcome:
    "Hey! Thanks for reaching out to {{brandName}}. 🤖 This is an automated assistant that can estimate a collab rate for {{campaignName}} — reply STOP anytime to opt out. Reply START when you’re ready.",
  no_active_campaign:
    "Thanks for reaching out to {{brandName}}! We’re not accepting collab requests right now — feel free to message again later.",
  stopped:
    "No problem — I won’t send any more automated messages. Reply ‘collab’ anytime to start again.",
  enriching: "One sec — checking your profile…",
  ineligible:
    "Based on this campaign’s criteria ({{minFollowers}}+ followers, {{minEngagement}}%+ engagement), you’re not a fit right now. Reply SUBMIT to save your details anyway, or STOP.",
  ask_reels: "How many Reels (0–5)? Reply with a number.",
  ask_stories: "How many Stories (0–5)? Reply with a number.",
  ask_usage:
    "Usage rights: 1 = none, 2 = 30-day paid ads, 3 = 90-day paid ads.",
  estimate:
    "Estimated collab rate: {{estimate}} ({{reels}} Reels, {{stories}} Stories, {{usage}}). Reply SUBMIT to send to the brand, or EDIT to change.",
  submitted_qualified:
    "You’re all set! Estimated rate: {{estimate}}. {{brandName}} will review and reply here.",
  submitted_archived: "Thanks — your details are on file with {{brandName}}.",
  invalid_input: "I didn’t catch that. {{hint}}",
  session_expired: "This session expired. Send ‘collab’ to start again.",
};

export type TemplateVars = Record<string, string | number>;

export function renderTemplate(key: TemplateKey, vars: TemplateVars = {}): string {
  return TEMPLATES[key].replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = vars[name];
    return value === undefined ? "" : String(value);
  });
}

export function usageLabel(adUsageDays: number): string {
  if (adUsageDays === 30) return "30-day paid ads";
  if (adUsageDays === 90) return "90-day paid ads";
  return "no ad usage";
}
