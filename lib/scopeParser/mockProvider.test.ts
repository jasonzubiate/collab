import { describe, expect, it } from "vitest";
import { MockScopeParser } from "./mockProvider";

const parser = new MockScopeParser();

describe("MockScopeParser", () => {
  it("extracts a full scope with high confidence", async () => {
    const result = await parser.parse("2 reels and a story, 30-day usage");
    expect(result.reelsCount).toBe(2);
    expect(result.storiesCount).toBe(1);
    expect(result.adUsageDays).toBe(30);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.needsClarification).toBe(false);
  });

  it("treats a bare 'a story' as one story", async () => {
    const result = await parser.parse("3 reels and a story, no usage");
    expect(result.reelsCount).toBe(3);
    expect(result.storiesCount).toBe(1);
    expect(result.adUsageDays).toBe(0);
  });

  it("counts plural stories", async () => {
    const result = await parser.parse("1 reel and 2 stories, 90 day usage");
    expect(result.reelsCount).toBe(1);
    expect(result.storiesCount).toBe(2);
    expect(result.adUsageDays).toBe(90);
  });

  it("flags an unsupported usage tier (60-day) for clarification", async () => {
    const result = await parser.parse("60-day");
    // 60 is not in {0,30,90}: snapped to null and flagged.
    expect(result.adUsageDays).toBeNull();
    expect(result.needsClarification).toBe(true);
  });

  it("returns needsClarification with zero confidence for gibberish", async () => {
    const result = await parser.parse("asdf qwerty zzz");
    expect(result.reelsCount).toBeNull();
    expect(result.storiesCount).toBeNull();
    expect(result.adUsageDays).toBeNull();
    expect(result.confidence).toBe(0);
    expect(result.needsClarification).toBe(true);
  });

  it("is deterministic for the same input", async () => {
    const a = await parser.parse("4 reels, 1 story, 30 day");
    const b = await parser.parse("4 reels, 1 story, 30 day");
    expect(a).toEqual(b);
  });
});
