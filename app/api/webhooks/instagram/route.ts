import { after } from "next/server";
import { appSecret, webhookVerifyToken } from "@/lib/instagram/config";
import { markMidSeen } from "@/lib/instagram/dedup";
import { parseInboundEvents, verifySignature } from "@/lib/instagram/webhook";
import { getConnectionByIgUserId } from "@/lib/services/instagramConnectionService";
import { processInboundMessage } from "@/lib/services/instagramConversationService";

/**
 * GET: Meta's subscribe-time verification handshake. Echo `hub.challenge` back
 * when `hub.verify_token` matches our configured token.
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expected = webhookVerifyToken();
  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST: receive message events. Verify the HMAC over the RAW body, respond 200
 * immediately, then run the state machine in `after()` so Meta isn't blocked.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const secret = appSecret();

  if (secret) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifySignature(raw, signature, secret)) {
      return new Response("Invalid signature", { status: 403 });
    }
  } else {
    // No app secret configured (e.g. local simulation). Process unverified but
    // log so this is never silently relied on in production.
    console.warn(
      "[instagram-webhook] META_APP_SECRET not set; skipping signature verification",
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const events = parseInboundEvents(payload);

  after(async () => {
    for (const event of events) {
      if (!markMidSeen(event.mid)) continue; // duplicate delivery

      const connection = await getConnectionByIgUserId(event.recipientIgUserId);
      if (!connection) continue; // event for an account we don't manage

      try {
        await processInboundMessage({
          brandId: connection.brandId,
          instagramScopedUserId: event.senderIgsid,
          text: event.text,
        });
      } catch (error) {
        console.error("[instagram-webhook] processing failed", {
          mid: event.mid,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  });

  return new Response("EVENT_RECEIVED", { status: 200 });
}
