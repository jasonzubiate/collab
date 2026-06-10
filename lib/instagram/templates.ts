/**
 * Fixed DM copy (PRD section 13). No admin editor in v1.
 *
 * The `welcome` template carries the required automation disclosure and the
 * STOP opt-out (PRD section 6). Placeholders are `{{key}}`.
 */
import { richRepliesEnabled } from "./config";
import { Payload } from "./messageContent";
import type { OutboundMessage, QuickReply } from "./messageContent";

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

/** Six numeric quick-reply chips ("0".."5") used by the scope questions. */
function scopeCountChips(): QuickReply[] {
  return Array.from({ length: 6 }, (_unused, n) => ({
    title: String(n),
    payload: String(n),
  }));
}

/**
 * Build a structured outbound message for a template: the rendered text plus
 * the tappable quick replies / buttons appropriate for that step.
 *
 * Flag-gated: when `IG_RICH_REPLIES_ENABLED` is off, this returns `{ text }`
 * only, so the channel falls back to plain-text / numeric replies and existing
 * behavior is preserved. The payload vocabulary mirrors the text-parser inputs
 * so the conversation service can route taps and typed replies identically.
 */
export function buildMessage(
  key: TemplateKey,
  vars: TemplateVars = {},
): OutboundMessage {
  const text = renderTemplate(key, vars);
  if (!richRepliesEnabled()) return { text };

  switch (key) {
    case "welcome":
      return {
        text,
        quickReplies: [{ title: "Start", payload: Payload.START }],
      };
    case "ask_usage":
      return {
        text,
        quickReplies: [
          { title: "None", payload: Payload.USAGE_NONE },
          { title: "30-day", payload: Payload.USAGE_30 },
          { title: "90-day", payload: Payload.USAGE_90 },
        ],
      };
    case "estimate":
      return {
        text,
        buttons: [
          { type: "postback", title: "Submit", payload: Payload.SUBMIT },
          { type: "postback", title: "Edit", payload: Payload.EDIT },
        ],
      };
    case "ineligible":
      return {
        text,
        quickReplies: [
          { title: "Submit anyway", payload: Payload.SUBMIT_ANYWAY },
          { title: "Stop", payload: Payload.STOP },
        ],
      };
    case "ask_reels":
    case "ask_stories":
      return { text, quickReplies: scopeCountChips() };
    default:
      return { text };
  }
}
