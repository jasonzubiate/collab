/**
 * App-level token encryption for secrets at rest (e.g. Instagram access tokens).
 *
 * Uses AES-256-GCM with a 32-byte key from `TOKEN_ENCRYPTION_KEY`. The stored
 * string is `v1:<iv>:<authTag>:<ciphertext>` (all base64). The version prefix
 * lets us rotate the scheme later without ambiguity.
 *
 * Never log the plaintext token or the key. Decryption failures throw.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const SCHEME = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit nonce recommended for GCM
const KEY_BYTES = 32;

/**
 * Resolve the encryption key from env. Accepts a base64 or hex 32-byte key, or
 * any UTF-8 string of exactly 32 bytes. Throws if missing/invalid so we fail
 * closed rather than storing tokens in the clear.
 */
function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not set. Generate one with: openssl rand -base64 32",
    );
  }

  const candidates: Buffer[] = [];
  try {
    candidates.push(Buffer.from(raw, "base64"));
  } catch {
    // ignore
  }
  if (/^[0-9a-fA-F]+$/.test(raw)) {
    candidates.push(Buffer.from(raw, "hex"));
  }
  candidates.push(Buffer.from(raw, "utf8"));

  const key = candidates.find((buf) => buf.length === KEY_BYTES);
  if (!key) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (base64, hex, or utf8).",
    );
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    SCHEME,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptToken(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== SCHEME) {
    throw new Error("Malformed encrypted token.");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const key = getKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64!, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64!, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataB64!, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
