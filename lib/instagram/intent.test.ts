import { describe, expect, it } from "vitest";
import {
  hasCollabIntent,
  isStartKeyword,
  isStopKeyword,
  normalizeText,
} from "./intent";

describe("normalizeText", () => {
  it("lowercases, strips punctuation, and collapses whitespace", () => {
    expect(normalizeText("  Hey!! COLLAB??  ")).toBe("hey collab");
  });
});

describe("hasCollabIntent", () => {
  it.each([
    "I'd love to collab with you!",
    "Do you have a rate card?",
    "interested in a paid promo",
    "Are you open to a brand deal?",
    "lets work together",
  ])("matches %s", (text) => {
    expect(hasCollabIntent(text)).toBe(true);
  });

  it.each(["hello there", "great post!", "the ratepayer association"])(
    "does not match %s",
    (text) => {
      expect(hasCollabIntent(text)).toBe(false);
    },
  );

  it("requires whole-word match for single keywords", () => {
    expect(hasCollabIntent("collaborate")).toBe(false); // not a listed keyword
    expect(hasCollabIntent("collab")).toBe(true);
  });
});

describe("stop/start keywords", () => {
  it("detects STOP case-insensitively", () => {
    expect(isStopKeyword("STOP")).toBe(true);
    expect(isStopKeyword(" stop ")).toBe(true);
    expect(isStopKeyword("please stop")).toBe(false);
  });

  it("detects START case-insensitively", () => {
    expect(isStartKeyword("Start")).toBe(true);
    expect(isStartKeyword("go")).toBe(false);
  });
});
