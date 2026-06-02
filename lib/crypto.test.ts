import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "./crypto";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("token encryption", () => {
  it("round-trips a token", () => {
    const secret = "IGAAR_super_secret_access_token_value";
    const encrypted = encryptToken(secret);
    expect(encrypted).not.toContain(secret);
    expect(encrypted.startsWith("v1:")).toBe(true);
    expect(decryptToken(encrypted)).toBe(secret);
  });

  it("produces distinct ciphertext per call (random IV)", () => {
    const a = encryptToken("same");
    const b = encryptToken("same");
    expect(a).not.toBe(b);
    expect(decryptToken(a)).toBe("same");
    expect(decryptToken(b)).toBe("same");
  });

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptToken("tamper-me");
    const parts = encrypted.split(":");
    const corruptedData = Buffer.from("deadbeef", "hex").toString("base64");
    const tampered = [parts[0], parts[1], parts[2], corruptedData].join(":");
    expect(() => decryptToken(tampered)).toThrow();
  });

  it("rejects a malformed payload", () => {
    expect(() => decryptToken("not-a-valid-token")).toThrow();
  });
});
