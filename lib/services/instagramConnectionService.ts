/**
 * Manages the per-brand Instagram connection: OAuth completion, encrypted token
 * storage, webhook subscription, status, and disconnect.
 */
import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/crypto";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchProfile,
  subscribeWebhooks,
  unsubscribeWebhooks,
} from "@/lib/instagram/graphClient";

export type ConnectionStatus = {
  connected: boolean;
  igUserId?: string;
  igUsername?: string | null;
  webhookSubscribed?: boolean;
  tokenExpiresAt?: string | null;
};

export async function getConnectionForBrand(brandId: string) {
  return prisma.instagramConnection.findUnique({ where: { brandId } });
}

/** Resolve the brand that owns the IG account a webhook event was sent to. */
export async function getConnectionByIgUserId(igUserId: string) {
  return prisma.instagramConnection.findUnique({ where: { igUserId } });
}

export async function getStatus(brandId: string): Promise<ConnectionStatus> {
  const connection = await getConnectionForBrand(brandId);
  if (!connection) return { connected: false };
  return {
    connected: true,
    igUserId: connection.igUserId,
    igUsername: connection.igUsername,
    webhookSubscribed: connection.webhookSubscribed,
    tokenExpiresAt: connection.tokenExpiresAt?.toISOString() ?? null,
  };
}

/** Return the decrypted access token for a brand, or null if not connected. */
export async function getAccessToken(brandId: string): Promise<string | null> {
  const connection = await getConnectionForBrand(brandId);
  if (!connection) return null;
  return decryptToken(connection.accessTokenEnc);
}

export type CompleteConnectionResult =
  | { ok: true; status: ConnectionStatus }
  | { ok: false; error: string };

/**
 * Finish the OAuth flow: exchange the code, upgrade to a long-lived token,
 * fetch the profile, subscribe webhooks, and persist the encrypted token.
 */
export async function completeConnection(
  brandId: string,
  code: string,
): Promise<CompleteConnectionResult> {
  try {
    const short = await exchangeCodeForToken(code);
    const long = await exchangeForLongLivedToken(short.accessToken);
    const profile = await fetchProfile(long.accessToken);

    let webhookSubscribed = false;
    try {
      await subscribeWebhooks(long.accessToken);
      webhookSubscribed = true;
    } catch {
      // Non-fatal: the connection is stored; admin can retry subscription.
      webhookSubscribed = false;
    }

    const igUserId = profile.igUserId || short.userId;
    const accessTokenEnc = encryptToken(long.accessToken);

    await prisma.instagramConnection.upsert({
      where: { brandId },
      create: {
        brandId,
        igUserId,
        igUsername: profile.username,
        accessTokenEnc,
        tokenExpiresAt: long.expiresAt,
        webhookSubscribed,
      },
      update: {
        igUserId,
        igUsername: profile.username,
        accessTokenEnc,
        tokenExpiresAt: long.expiresAt,
        webhookSubscribed,
      },
    });

    // Mirror onto Brand for parity with the existing field (PRD section 5.1).
    await prisma.brand.update({
      where: { id: brandId },
      data: { instagramBusinessId: igUserId },
    });

    return { ok: true, status: await getStatus(brandId) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to connect Instagram.";
    return { ok: false, error: message };
  }
}

export async function disconnect(brandId: string): Promise<void> {
  const connection = await getConnectionForBrand(brandId);
  if (!connection) return;

  try {
    const token = decryptToken(connection.accessTokenEnc);
    await unsubscribeWebhooks(token);
  } catch {
    // Best-effort: continue with local deletion even if revoke fails.
  }

  await prisma.instagramConnection.delete({ where: { brandId } });
  await prisma.brand.update({
    where: { id: brandId },
    data: { instagramBusinessId: null },
  });
}

/** Lightweight health check: confirm the stored token still resolves a profile. */
export async function verifyConnection(
  brandId: string,
): Promise<{ ok: boolean; igUsername?: string | null; error?: string }> {
  const connection = await getConnectionForBrand(brandId);
  if (!connection) return { ok: false, error: "Not connected." };
  try {
    const token = decryptToken(connection.accessTokenEnc);
    const profile = await fetchProfile(token);
    if (profile.username && profile.username !== connection.igUsername) {
      await prisma.instagramConnection.update({
        where: { brandId },
        data: { igUsername: profile.username },
      });
    }
    return { ok: true, igUsername: profile.username };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Health check failed.";
    return { ok: false, error: message };
  }
}
