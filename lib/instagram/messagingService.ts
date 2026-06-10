/**
 * High-level outbound DM sending. Resolves the brand's encrypted token, calls
 * the real Graph send endpoint, and reports success/failure WITHOUT throwing so
 * a failed send never breaks webhook processing or a dashboard action.
 *
 * Note: `lib/rateLimit.ts` is in-memory/per-instance and cannot coordinate send
 * throttling across serverless instances (PRD section 10). Treat Graph `429`s as
 * the source of truth and back off there if/when a real queue is added.
 */
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/crypto";
import { GraphApiError, sendRichMessage, sendTextMessage } from "./graphClient";
import type { OutboundMessage } from "./messageContent";

/** Meta's standard messaging window: 24h after the creator's last message. */
export const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isWithinMessagingWindow(lastInboundAt: Date | null): boolean {
  if (!lastInboundAt) return false;
  return Date.now() - lastInboundAt.getTime() <= MESSAGING_WINDOW_MS;
}

export type SendResult =
  | { ok: true; messageId: string | null }
  | { ok: false; error: string; status?: number };

export async function sendDm(
  brandId: string,
  recipientIgsid: string,
  text: string,
): Promise<SendResult> {
  const connection = await prisma.instagramConnection.findUnique({
    where: { brandId },
  });
  if (!connection) {
    return { ok: false, error: "Instagram is not connected for this brand." };
  }

  try {
    const token = decryptToken(connection.accessTokenEnc);
    const { messageId } = await sendTextMessage(
      token,
      connection.igUserId,
      recipientIgsid,
      text,
    );
    await prisma.instagramConnection.update({
      where: { brandId },
      data: { updatedAt: new Date() },
    });
    return { ok: true, messageId };
  } catch (error) {
    if (error instanceof GraphApiError) {
      return { ok: false, error: error.message, status: error.status };
    }
    const message = error instanceof Error ? error.message : "Send failed.";
    return { ok: false, error: message };
  }
}

/**
 * Structured-message counterpart of `sendDm`. Resolves the brand's encrypted
 * token and sends text + optional quick replies / buttons, swallowing failures
 * into a `SendResult` exactly like `sendDm`.
 */
export async function sendDmRich(
  brandId: string,
  recipientIgsid: string,
  content: OutboundMessage,
): Promise<SendResult> {
  const connection = await prisma.instagramConnection.findUnique({
    where: { brandId },
  });
  if (!connection) {
    return { ok: false, error: "Instagram is not connected for this brand." };
  }

  try {
    const token = decryptToken(connection.accessTokenEnc);
    const { messageId } = await sendRichMessage(
      token,
      connection.igUserId,
      recipientIgsid,
      content,
    );
    await prisma.instagramConnection.update({
      where: { brandId },
      data: { updatedAt: new Date() },
    });
    return { ok: true, messageId };
  } catch (error) {
    if (error instanceof GraphApiError) {
      return { ok: false, error: error.message, status: error.status };
    }
    const message = error instanceof Error ? error.message : "Send failed.";
    return { ok: false, error: message };
  }
}
