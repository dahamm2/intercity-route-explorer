import { describe, expect, it } from "vitest";
import { groupRoutePatterns } from "./route-grouping";

function route(overrides = {}) {
  return {
    agencyId: 12,
    agency: "Example Coach",
    sourceRouteId: 100,
    name: "Alpha to Gamma",
    patternName: "Alpha → Gamma",
    weeklyTrips: 7,
    stops: ["a", "b", "c"],
    segments: [],
    ...overrides,
  };
}

describe("operator and ordered-stop-pattern grouping", () => {
  it("sums weekly departures for identical operator and ordered stop patterns", () => {
    const grouped = groupRoutePatterns([
      route({ sourceRouteId: 100, weeklyTrips: 7 }),
      route({ sourceRouteId: 200, name: "Regional variant", weeklyTrips: 12 }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({
      weeklyTrips: 19,
      sourceFeatureCount: 2,
      sourceRouteIds: [100, 200],
      sourceNames: ["Alpha to Gamma", "Regional variant"],
      name: "Alpha → Gamma",
    });
  });

  it("keeps reversed stop orders as separate directional results", () => {
    const grouped = groupRoutePatterns([
      route(),
      route({ sourceRouteId: 101, stops: ["c", "b", "a"], patternName: "Gamma → Alpha" }),
    ]);

    expect(grouped).toHaveLength(2);
    expect(grouped.map((result) => result.weeklyTrips)).toEqual([7, 7]);
  });

  it("does not combine identical stop patterns from different operators", () => {
    const grouped = groupRoutePatterns([
      route(),
      route({ agencyId: 99, agency: "Another Operator", sourceRouteId: 300 }),
    ]);

    expect(grouped).toHaveLength(2);
  });
});
