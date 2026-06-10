/**
 * Structured outbound DM primitives (Phase A: rich messaging).
 *
 * These describe the *intent* of an outbound message (text + optional tappable
 * quick replies or buttons). The Graph client decides how to serialize them for
 * Meta, and the conversation service decides what to send. All of this is
 * feature-flag gated (`IG_RICH_REPLIES_ENABLED`) so we can ship dark and fall
 * back to plain text / numeric replies instantly.
 */

/** A tappable quick-reply chip. Meta caps `title` at 20 characters. */
export type QuickReply = { title: string; payload: string };

/** A button-template button: either a postback payload or an external URL. */
export type TemplateButton =
  | { type: "postback"; title: string; payload: string }
  | { type: "web_url"; title: string; url: string };

/** A structured outbound message: text plus optional quick replies or buttons. */
export type OutboundMessage = {
  text: string;
  quickReplies?: QuickReply[];
  buttons?: TemplateButton[];
};

/**
 * Canonical payload vocabulary for postbacks/quick replies. Keep this small —
 * only the actions Phase A needs. Numeric scope counts ("0".."5") are passed as
 * raw strings and are intentionally NOT enumerated here.
 */
export const Payload = {
  START: "START",
  USAGE_NONE: "USAGE_NONE",
  USAGE_30: "USAGE_30",
  USAGE_90: "USAGE_90",
  SUBMIT: "SUBMIT",
  EDIT: "EDIT",
  STOP: "STOP",
  SUBMIT_ANYWAY: "SUBMIT_ANYWAY",
  // Phase B: confirm an LLM-parsed scope before any (deterministic) pricing runs.
  CONFIRM: "CONFIRM",
} as const;

export type PayloadValue = (typeof Payload)[keyof typeof Payload];
