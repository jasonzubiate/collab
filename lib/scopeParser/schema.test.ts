import { describe, expect, it } from "vitest";
import {
  normalizeParsedScope,
  parseLlmResponse,
  rawParsedScopeSchema,
  type RawParsedScope,
} from "./schema";

describe("rawParsedScopeSchema", () => {
  it("accepts a valid raw extraction", () => {
    const parsed = rawParsedScopeSchema.safeParse({
      reelsCount: 2,
      storiesCount: 1,
      adUsageDays: 30,
      confidence: 0.9,
      needsClarification: false,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects out-of-range counts", () => {
    expect(
      rawParsedScopeSchema.safeParse({
        reelsCount: 9,
        storiesCount: 1,
        adUsageDays: 30,
        confidence: 0.9,
        needsClarification: false,
      }).success,
    ).toBe(false);
  });

  it("rejects out-of-range confidence", () => {
    expect(
      rawParsedScopeSchema.safeParse({
        reelsCount: 1,
        storiesCount: 1,
        adUsageDays: 0,
        confidence: 1.5,
        needsClarification: false,
      }).success,
    ).toBe(false);
  });

  it("rejects non-integer counts", () => {
    expect(
      rawParsedScopeSchema.safeParse({
        reelsCount: 1.5,
        storiesCount: 1,
        adUsageDays: 0,
        confidence: 0.5,
        needsClarification: false,
      }).success,
    ).toBe(false);
  });
});

describe("normalizeParsedScope", () => {
  const base: RawParsedScope = {
    reelsCount: 2,
    storiesCount: 1,
    adUsageDays: 30,
    confidence: 0.9,
    needsClarification: false,
  };

  it("passes canonical usage values through (0/30/90)", () => {
    expect(normalizeParsedScope({ ...base, adUsageDays: 0 }).adUsageDays).toBe(0);
    expect(normalizeParsedScope({ ...base, adUsageDays: 30 }).adUsageDays).toBe(30);
    expect(normalizeParsedScope({ ...base, adUsageDays: 90 }).adUsageDays).toBe(90);
  });

  it("flags and nulls out-of-vocabulary usage (e.g. 60)", () => {
    const result = normalizeParsedScope({ ...base, adUsageDays: 60 });
    expect(result.adUsageDays).toBeNull();
    expect(result.needsClarification).toBe(true);
  });

  it("preserves null usage without flagging", () => {
    const result = normalizeParsedScope({ ...base, adUsageDays: null });
    expect(result.adUsageDays).toBeNull();
    expect(result.needsClarification).toBe(false);
  });
});

describe("parseLlmResponse", () => {
  it("decodes a valid JSON object", () => {
    const result = parseLlmResponse(
      '{"reelsCount":2,"storiesCount":1,"adUsageDays":30,"confidence":0.95,"needsClarification":false}',
    );
    expect(result.reelsCount).toBe(2);
    expect(result.storiesCount).toBe(1);
    expect(result.adUsageDays).toBe(30);
    expect(result.needsClarification).toBe(false);
  });

  it("tolerates code fences / surrounding prose", () => {
    const result = parseLlmResponse(
      'Here you go:\n```json\n{"reelsCount":1,"storiesCount":0,"adUsageDays":0,"confidence":0.8,"needsClarification":false}\n```',
    );
    expect(result.reelsCount).toBe(1);
    expect(result.adUsageDays).toBe(0);
  });

  it("returns an unparseable result on invalid JSON", () => {
    const result = parseLlmResponse("not json at all");
    expect(result.confidence).toBe(0);
    expect(result.needsClarification).toBe(true);
  });

  it("returns an unparseable result when the schema rejects", () => {
    const result = parseLlmResponse(
      '{"reelsCount":99,"storiesCount":1,"adUsageDays":30,"confidence":0.9,"needsClarification":false}',
    );
    expect(result.confidence).toBe(0);
    expect(result.needsClarification).toBe(true);
  });
});
