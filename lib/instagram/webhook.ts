/**
 * Webhook signature verification and payload parsing (PRD sections 10 & 11).
 *
 * Signature MUST be verified against the RAW request body before JSON.parse —
 * parsing first loses the exact bytes the HMAC was computed over.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify the `X-Hub-Signature-256` header (`sha256=<hex>`) against the raw body
 * using the Meta app secret. Returns false on any malformed/missing input.
 */
export function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader) return false;
  const [scheme, provided] = signatureHeader.split("=");
  if (scheme !== "sha256" || !provided) return false;

  const expected = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  const providedBuf = Buffer.from(provided, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}

export type ParsedInboundEvent = {
  /** Recipient = the connected IG account that received the DM. */
  recipientIgUserId: string;
  /** Sender = the creator's Instagram-scoped user id (IGSID). */
  senderIgsid: string;
  mid: string;
  text: string;
  /**
   * Canonical payload from a quick-reply tap or a button postback, when the
   * inbound event carried one. The state machine routes on this first and falls
   * back to parsing `text` for typed replies.
   */
  postbackPayload?: string;
};

type WebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    messaging?: Array<{
      sender?: { id?: string };
      recipient?: { id?: string };
      message?: {
        mid?: string;
        text?: string;
        is_echo?: boolean;
        quick_reply?: { payload?: string };
      };
      postback?: {
        mid?: string;
        payload?: string;
        title?: string;
      };
    }>;
  }>;
};

/**
 * Flatten an Instagram webhook payload into inbound events. Skips echoes (our
 * own outbound). Emits:
 *  - plain text messages (`message.text`), as before;
 *  - quick-reply taps (`message.quick_reply.payload`) and button postbacks
 *    (top-level `postback.payload`) with `postbackPayload` set and `text`
 *    populated from the title/echoed text (falling back to the payload) so
 *    logging stays meaningful.
 * Events with neither text nor a payload are still dropped.
 */
export function parseInboundEvents(payload: unknown): ParsedInboundEvent[] {
  const data = payload as WebhookPayload;
  if (!data || !Array.isArray(data.entry)) return [];

  const events: ParsedInboundEvent[] = [];
  for (const entry of data.entry) {
    const messaging = entry.messaging ?? [];
    for (const item of messaging) {
      const message = item.message;
      const postback = item.postback;
      if (message?.is_echo) continue;

      const senderIgsid = item.sender?.id;
      const recipientIgUserId = item.recipient?.id ?? entry.id;
      if (!senderIgsid || !recipientIgUserId) continue;

      // Prefer a quick-reply payload, then a top-level postback payload.
      const postbackPayload = message?.quick_reply?.payload ?? postback?.payload;
      const mid = message?.mid ?? postback?.mid;
      if (!mid) continue;

      if (postbackPayload) {
        const text = message?.text ?? postback?.title ?? postbackPayload;
        events.push({ recipientIgUserId, senderIgsid, mid, text, postbackPayload });
        continue;
      }

      const text = message?.text;
      if (!text) continue;
      events.push({ recipientIgUserId, senderIgsid, mid, text });
    }
  }
  return events;
}
