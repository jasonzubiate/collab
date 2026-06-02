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
      };
    }>;
  }>;
};

/**
 * Flatten an Instagram webhook payload into inbound text messages. Skips echoes
 * (our own outbound) and non-text events (no `message.text`).
 */
export function parseInboundEvents(payload: unknown): ParsedInboundEvent[] {
  const data = payload as WebhookPayload;
  if (!data || !Array.isArray(data.entry)) return [];

  const events: ParsedInboundEvent[] = [];
  for (const entry of data.entry) {
    const messaging = entry.messaging ?? [];
    for (const item of messaging) {
      const message = item.message;
      if (!message || message.is_echo) continue;
      const text = message.text;
      const mid = message.mid;
      const senderIgsid = item.sender?.id;
      const recipientIgUserId = item.recipient?.id ?? entry.id;
      if (!text || !mid || !senderIgsid || !recipientIgUserId) continue;
      events.push({ recipientIgUserId, senderIgsid, mid, text });
    }
  }
  return events;
}
