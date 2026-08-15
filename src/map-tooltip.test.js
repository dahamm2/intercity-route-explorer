import { describe, expect, it } from "vitest";
import { formatRouteTooltipLabel } from "./map-tooltip";

describe("formatRouteTooltipLabel", () => {
  it("joins operator and route name with a centered dot", () => {
    expect(formatRouteTooltipLabel("Greyhound-us", "Chicago - Bloomington - Danville")).toBe(
      "Greyhound-us · Chicago - Bloomington - Danville",
    );
  });

  it("keeps the source operator and pattern names unchanged", () => {
    expect(formatRouteTooltipLabel("Peoria Charter Coach", "Chicago - Peoria")).toBe(
      "Peoria Charter Coach · Chicago - Peoria",
    );
  });

  it("falls back to whichever part is present", () => {
    expect(formatRouteTooltipLabel("Greyhound-us", "  ")).toBe("Greyhound-us");
    expect(formatRouteTooltipLabel("", "Express")).toBe("Express");
    expect(formatRouteTooltipLabel(undefined, undefined)).toBe("");
  });
});
