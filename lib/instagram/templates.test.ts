import { describe, expect, it } from "vitest";
import { renderTemplate, usageLabel } from "./templates";

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
