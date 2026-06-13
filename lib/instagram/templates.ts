/**
 * Fixed DM copy (PRD section 13). No admin editor in v1.
 *
 * The `welcome` template carries the required automation disclosure and the
 * STOP opt-out (PRD section 6). Placeholders are `{{key}}`.
 */
import {
  buildIneligibleCopyFragments,
  computeEligibilityGaps,
  formatIneligibleDmMessage,
} from "@/lib/pricing/computeEligibilityGaps";
import { usageLabel } from "@/lib/pricing/usageMultiplier";
import { Payload } from "./messageContent";
import type { OutboundMessage, QuickReply } from "./messageContent";

export { usageLabel };

export type TemplateKey =
  | "welcome"
  | "no_active_campaign"
  | "stopped"
  | "enriching"
  | "ineligible"
  | "ask_reels"
  | "ask_stories"
  | "ask_usage"
  | "scope_confirm"
  | "estimate"
  | "submitted_qualified"
  | "submitted_archived"
  | "invalid_input"
  | "session_expired";

const TEMPLATES: Record<Exclude<TemplateKey, "ineligible">, string> = {
  welcome:
    "Hey! Thanks for reaching out to {{brandName}}. 🤖 This is an automated assistant that can estimate a collab rate for {{campaignName}} — reply STOP anytime to opt out. Reply START when you're ready.",
  no_active_campaign:
    "Thanks for reaching out to {{brandName}}! We're not accepting collab requests right now — feel free to message again later.",
  stopped:
    "No problem — I won't send any more automated messages. Reply 'collab' anytime to start again.",
  enriching: "One sec — checking your profile…",
  ask_reels:
    "Hey{{creatorGreeting}}! How many Reels (0–5)? Tap a number or reply with a number.",
  ask_stories: "How many Stories (0–5)? Reply with a number.",
  ask_usage:
    "Usage rights: 1 = none, 2 = 30-day paid ads, 3 = 90-day paid ads.",
  scope_confirm:
    "Got it: {{reels}} Reels, {{stories}} Stories, {{usage}}. Reply CONFIRM to price it, or EDIT to change.",
  estimate:
    "Hey{{creatorGreeting}} — here's your estimate for {{campaignName}}:\n\n{{breakdown}}\n\nReply SUBMIT to send this to {{brandName}}, or EDIT to change your scope.",
  submitted_qualified:
    "You're all set{{creatorGreeting}}! Estimated rate: {{estimate}}. {{brandName}} will review and reply here.",
  submitted_archived: "Thanks — your details are on file with {{brandName}}.",
  invalid_input: "I didn't catch that. {{hint}}",
  session_expired: "This session expired. Send 'collab' to start again.",
};

const LEGACY_INELIGIBLE =
  "Based on this campaign's criteria ({{minFollowers}}+ followers, {{minEngagement}}%+ engagement), you're not a fit right now. Reply SUBMIT to save your details anyway, or STOP.";

export type TemplateVars = Record<string, string | number | boolean>;

export type IneligibleTemplateVars = TemplateVars & {
  campaignName: string;
  creatorGreeting?: string;
  failedFollowerThreshold: boolean;
  failedEngagementThreshold: boolean;
  followerCount: number;
  engagementRate: number;
  minFollowers: number;
  minEngagementRate: number;
};

export function renderTemplate(key: TemplateKey, vars: TemplateVars = {}): string {
  if (key === "ineligible") {
    return LEGACY_INELIGIBLE.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
      const value = vars[name];
      return value === undefined ? "" : String(value);
    });
  }
  return TEMPLATES[key].replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = vars[name];
    return value === undefined ? "" : String(value);
  });
}

export function buildIneligibleMessage(vars: IneligibleTemplateVars): string {
  const gaps = computeEligibilityGaps({
    failedFollowerThreshold: Boolean(vars.failedFollowerThreshold),
    failedEngagementThreshold: Boolean(vars.failedEngagementThreshold),
    metrics: {
      followerCount: Number(vars.followerCount),
      engagementRate: Number(vars.engagementRate),
    },
    minFollowers: Number(vars.minFollowers),
    minEngagementRate: Number(vars.minEngagementRate),
  });
  const fragments = buildIneligibleCopyFragments(
    gaps,
    {
      followerCount: Number(vars.followerCount),
      engagementRate: Number(vars.engagementRate),
    },
    {
      minFollowers: Number(vars.minFollowers),
      minEngagementRate: Number(vars.minEngagementRate),
    },
  );
  return formatIneligibleDmMessage(gaps, {
    ...fragments,
    creatorGreeting: vars.creatorGreeting ? String(vars.creatorGreeting) : "",
    campaignName: String(vars.campaignName),
  });
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
 */
export function buildMessage(
  key: TemplateKey,
  vars: TemplateVars = {},
): OutboundMessage {
  const text =
    key === "ineligible" && vars.campaignName != null
      ? buildIneligibleMessage(vars as IneligibleTemplateVars)
      : renderTemplate(key, vars);

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
    case "scope_confirm":
      return {
        text,
        quickReplies: [
          { title: "Confirm", payload: Payload.CONFIRM },
          { title: "Edit", payload: Payload.EDIT },
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
