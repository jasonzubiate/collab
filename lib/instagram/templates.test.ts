import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMessage, renderTemplate, usageLabel } from "./templates";
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
    expect(renderTemplate("invalid_input", {})).toBe("I didn’t catch that. ");
  });

  it("formats the estimate template with all values", () => {
    const text = renderTemplate("estimate", {
      estimate: "$1,200.00",
      reels: 2,
      stories: 1,
      usage: "30-day paid ads",
    });
    expect(text).toContain("$1,200.00");
    expect(text).toContain("2 Reels");
    expect(text).toContain("1 Stories");
    expect(text).toContain("30-day paid ads");
  });
});

describe("usageLabel", () => {
  it("maps usage days to labels", () => {
    expect(usageLabel(0)).toBe("no ad usage");
    expect(usageLabel(30)).toBe("30-day paid ads");
    expect(usageLabel(90)).toBe("90-day paid ads");
  });
});

describe("buildMessage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("with IG_RICH_REPLIES_ENABLED on", () => {
    function enable() {
      vi.stubEnv("IG_RICH_REPLIES_ENABLED", "1");
    }

    it("welcome still discloses automation + STOP and adds a Start chip", () => {
      enable();
      const msg = buildMessage("welcome", { brandName: "Acme", campaignName: "X" });
      expect(msg.text.toLowerCase()).toContain("automated");
      expect(msg.text).toContain("STOP");
      expect(msg.quickReplies).toEqual([{ title: "Start", payload: Payload.START }]);
    });

    it("ask_usage offers None/30-day/90-day chips with usage payloads", () => {
      enable();
      const msg = buildMessage("ask_usage");
      expect(msg.quickReplies).toEqual([
        { title: "None", payload: Payload.USAGE_NONE },
        { title: "30-day", payload: Payload.USAGE_30 },
        { title: "90-day", payload: Payload.USAGE_90 },
      ]);
    });

    it("estimate offers Submit/Edit postback buttons", () => {
      enable();
      const msg = buildMessage("estimate", {
        estimate: "$500.00",
        reels: 2,
        stories: 1,
        usage: "30-day paid ads",
      });
      expect(msg.buttons).toEqual([
        { type: "postback", title: "Submit", payload: Payload.SUBMIT },
        { type: "postback", title: "Edit", payload: Payload.EDIT },
      ]);
      expect(msg.quickReplies).toBeUndefined();
    });

    it("ineligible offers submit-anyway / stop chips", () => {
      enable();
      const msg = buildMessage("ineligible", { minFollowers: 1000, minEngagement: 2 });
      expect(msg.quickReplies).toEqual([
        { title: "Submit anyway", payload: Payload.SUBMIT_ANYWAY },
        { title: "Stop", payload: Payload.STOP },
      ]);
    });

    it("ask_reels / ask_stories offer six numeric chips (0..5)", () => {
      enable();
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
      enable();
      const msg = buildMessage("enriching");
      expect(msg.quickReplies).toBeUndefined();
      expect(msg.buttons).toBeUndefined();
      expect(msg.text).toBe(renderTemplate("enriching"));
    });
  });

  describe("with IG_RICH_REPLIES_ENABLED off", () => {
    it("returns text only (no chips/buttons) so we ship dark / roll back", () => {
      vi.stubEnv("IG_RICH_REPLIES_ENABLED", "");
      const welcome = buildMessage("welcome", { brandName: "Acme", campaignName: "X" });
      expect(welcome.quickReplies).toBeUndefined();
      expect(welcome.buttons).toBeUndefined();
      expect(welcome.text).toBe(renderTemplate("welcome", { brandName: "Acme", campaignName: "X" }));

      const estimate = buildMessage("estimate", {
        estimate: "$500.00",
        reels: 2,
        stories: 1,
        usage: "30-day paid ads",
      });
      expect(estimate.buttons).toBeUndefined();
      expect(estimate.quickReplies).toBeUndefined();
    });
  });
});
