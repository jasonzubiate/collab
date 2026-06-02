import { describe, expect, it } from "vitest";
import { MockEnrichmentProvider } from "./mockProvider";

const provider = new MockEnrichmentProvider();

describe("MockEnrichmentProvider", () => {
  it("returns metrics within the documented ranges", async () => {
    const profile = await provider.enrich("someCreator");
    expect(profile.followerCount).toBeGreaterThanOrEqual(2_000);
    expect(profile.followerCount).toBeLessThanOrEqual(150_000);
    expect(profile.engagementRate).toBeGreaterThanOrEqual(0.5);
    expect(profile.engagementRate).toBeLessThanOrEqual(6.0);
    expect(profile.provider).toBe("mock");
  });

  it("is deterministic for the same normalized handle", async () => {
    const a = await provider.enrich("@MyHandle");
    const b = await provider.enrich("myhandle");
    expect(a.followerCount).toBe(b.followerCount);
    expect(a.engagementRate).toBe(b.engagementRate);
    expect(a.handle).toBe("myhandle");
  });

  it("produces different metrics for different handles", async () => {
    const a = await provider.enrich("creator_one");
    const b = await provider.enrich("creator_two");
    expect(
      a.followerCount !== b.followerCount ||
        a.engagementRate !== b.engagementRate,
    ).toBe(true);
  });
});
