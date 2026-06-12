import { describe, expect, it } from "vitest";
import { buildMessage, buildIneligibleMessage, renderTemplate, usageLabel } from "./templates";
import { Payload } from "./messageContent";

describe("renderTemplate", () => {
  it("substitutes placeholders", () => {
    const text = renderTemplate("welcome", {
      brandName: "Acme",
      campaignName: "Summer Launch",
    });
    expect(text).toContain("Acme");
    expect(text).toContain("Summer Launch");
  });

  it("welcome discloses automation and the STOP opt-out (PRD section 6)", () => {
    const text = renderTemplate("welcome", {
      brandName: "Acme",
      campaignName: "X",
    });
    expect(text.toLowerCase()).toContain("automated");
    expect(text).toContain("STOP");
  });

  it("leaves unknown placeholders empty", () => {
    expect(renderTemplate("invalid_input", {})).toBe("I didn't catch that. ");
  });

  it("formats the estimate template with breakdown", () => {
    const text = renderTemplate("estimate", {
      creatorGreeting: " @maya",
      campaignName: "Summer Drop",
      breakdown:
        "$380.00 base (38K followers) + $500.00 reels + $75.00 story × 1.2 (30-day paid ads) = $1,146.00",
      brandName: "Acme",
    });
    expect(text).toContain("@maya");
    expect(text).toContain("Summer Drop");
    expect(text).toContain("$1,146.00");
    expect(text).toContain("SUBMIT");
  });

  it("personalizes ask_reels when creatorGreeting is set", () => {
    const text = renderTemplate("ask_reels", { creatorGreeting: " @maya" });
    expect(text).toContain("Hey @maya!");
  });
});

describe("usageLabel", () => {
  it("maps usage days to labels", () => {
    expect(usageLabel(0)).toBe("no ad usage");
    expect(usageLabel(30)).toBe("30-day paid ads");
    expect(usageLabel(90)).toBe("90-day paid ads");
  });
});

describe("buildIneligibleMessage", () => {
  it("renders follower-only gap copy with DM CTA", () => {
    const text = buildIneligibleMessage({
      campaignName: "Summer Drop",
      creatorGreeting: " @maya",
      failedFollowerThreshold: true,
      failedEngagementThreshold: false,
      followerCount: 38_000,
      engagementRate: 4.1,
      minFollowers: 40_000,
      minEngagementRate: 2.0,
    });
    expect(text).toContain("38K");
    expect(text).toContain("2K short");
    expect(text).toContain("SUBMIT ANYWAY");
  });

  it("renders engagement-only gap copy", () => {
    const text = buildIneligibleMessage({
      campaignName: "Summer Drop",
      failedFollowerThreshold: false,
      failedEngagementThreshold: true,
      followerCount: 50_000,
      engagementRate: 1.4,
      minFollowers: 10_000,
      minEngagementRate: 2.0,
    });
    expect(text).toContain("1.4%");
    expect(text).toContain("below the 2.0% minimum");
  });

  it("renders both-failed gap copy", () => {
    const text = buildIneligibleMessage({
      campaignName: "Summer Drop",
      failedFollowerThreshold: true,
      failedEngagementThreshold: true,
      followerCount: 6_500,
      engagementRate: 1.4,
      minFollowers: 10_000,
      minEngagementRate: 2.0,
    });
    expect(text).toContain("10K+ followers");
    expect(text).toContain("2.0%+ engagement");
  });
});

describe("buildMessage", () => {
  it("welcome still discloses automation + STOP and adds a Start chip", () => {
    const msg = buildMessage("welcome", { brandName: "Acme", campaignName: "X" });
    expect(msg.text.toLowerCase()).toContain("automated");
    expect(msg.text).toContain("STOP");
    expect(msg.quickReplies).toEqual([{ title: "Start", payload: Payload.START }]);
  });

  it("ask_usage offers None/30-day/90-day chips with usage payloads", () => {
    const msg = buildMessage("ask_usage");
    expect(msg.quickReplies).toEqual([
      { title: "None", payload: Payload.USAGE_NONE },
      { title: "30-day", payload: Payload.USAGE_30 },
      { title: "90-day", payload: Payload.USAGE_90 },
    ]);
  });

  it("estimate offers Submit/Edit postback buttons and stays under 640 chars", () => {
    const msg = buildMessage("estimate", {
      creatorGreeting: " @maya",
      campaignName: "Summer Drop",
      brandName: "Acme Studio",
      breakdown:
        "$380.00 base (38K followers) + $500.00 reels + $75.00 story × 1.2 (30-day paid ads) = $1,146.00",
      estimate: "$1,146.00",
    });
    expect(msg.buttons).toEqual([
      { type: "postback", title: "Submit", payload: Payload.SUBMIT },
      { type: "postback", title: "Edit", payload: Payload.EDIT },
    ]);
    expect(msg.quickReplies).toBeUndefined();
    expect(msg.text.length).toBeLessThan(640);
  });

  it("ineligible offers submit-anyway / stop chips", () => {
    const msg = buildMessage("ineligible", {
      campaignName: "Summer Drop",
      failedFollowerThreshold: true,
      failedEngagementThreshold: false,
      followerCount: 38_000,
      engagementRate: 4.1,
      minFollowers: 40_000,
      minEngagementRate: 2.0,
    });
    expect(msg.quickReplies).toEqual([
      { title: "Submit anyway", payload: Payload.SUBMIT_ANYWAY },
      { title: "Stop", payload: Payload.STOP },
    ]);
    expect(msg.text).toContain("short");
  });

  it("ask_reels / ask_stories offer six numeric chips (0..5)", () => {
    for (const key of ["ask_reels", "ask_stories"] as const) {
      const msg = buildMessage(key);
      expect(msg.quickReplies).toEqual([
        { title: "0", payload: "0" },
        { title: "1", payload: "1" },
        { title: "2", payload: "2" },
        { title: "3", payload: "3" },
        { title: "4", payload: "4" },
        { title: "5", payload: "5" },
      ]);
    }
  });

  it("other keys return text only", () => {
    const msg = buildMessage("enriching");
    expect(msg.quickReplies).toBeUndefined();
    expect(msg.buttons).toBeUndefined();
    expect(msg.text).toBe(renderTemplate("enriching"));
  });
});
