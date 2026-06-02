import { describe, expect, it } from "vitest";
import { isPseudoHandle, pseudoHandleForIgsid } from "./identity";

describe("pseudoHandleForIgsid", () => {
  it("is deterministic for the same IGSID", () => {
    expect(pseudoHandleForIgsid("178414")).toBe(pseudoHandleForIgsid("178414"));
  });

  it("differs across IGSIDs", () => {
    expect(pseudoHandleForIgsid("1")).not.toBe(pseudoHandleForIgsid("2"));
  });

  it("produces an ig_ prefixed handle recognized as pseudo", () => {
    const handle = pseudoHandleForIgsid("abc123");
    expect(handle.startsWith("ig_")).toBe(true);
    expect(isPseudoHandle(handle)).toBe(true);
    expect(isPseudoHandle("realuser")).toBe(false);
  });
});
