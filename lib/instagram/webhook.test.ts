import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseInboundEvents, verifySignature } from "./webhook";

const SECRET = "test-app-secret";

function sign(body: string): string {
  return "sha256=" + createHmac("sha256", SECRET).update(body, "utf8").digest("hex");
}

describe("verifySignature", () => {
  it("accepts a correct signature", () => {
    const body = JSON.stringify({ object: "instagram" });
    expect(verifySignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a wrong signature", () => {
    const body = JSON.stringify({ object: "instagram" });
    expect(verifySignature(body, "sha256=deadbeef", SECRET)).toBe(false);
  });

  it("rejects a missing or malformed header", () => {
    expect(verifySignature("{}", null, SECRET)).toBe(false);
    expect(verifySignature("{}", "md5=abc", SECRET)).toBe(false);
  });
});

describe("parseInboundEvents", () => {
  it("extracts text messages with sender/recipient/mid", () => {
    const payload = {
      object: "instagram",
      entry: [
        {
          id: "IG_ACCOUNT_1",
          messaging: [
            {
              sender: { id: "IGSID_CREATOR" },
              recipient: { id: "IG_ACCOUNT_1" },
              message: { mid: "mid_1", text: "collab?" },
            },
          ],
        },
      ],
    };
    const events = parseInboundEvents(payload);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      recipientIgUserId: "IG_ACCOUNT_1",
      senderIgsid: "IGSID_CREATOR",
      mid: "mid_1",
      text: "collab?",
    });
  });

  it("skips echoes and non-text events", () => {
    const payload = {
      entry: [
        {
          id: "IG_ACCOUNT_1",
          messaging: [
            {
              sender: { id: "IG_ACCOUNT_1" },
              recipient: { id: "IGSID_CREATOR" },
              message: { mid: "mid_echo", text: "hi", is_echo: true },
            },
            {
              sender: { id: "IGSID_CREATOR" },
              recipient: { id: "IG_ACCOUNT_1" },
              message: { mid: "mid_noText" },
            },
          ],
        },
      ],
    };
    expect(parseInboundEvents(payload)).toHaveLength(0);
  });

  it("returns empty for malformed payloads", () => {
    expect(parseInboundEvents(null)).toEqual([]);
    expect(parseInboundEvents({})).toEqual([]);
  });
});
