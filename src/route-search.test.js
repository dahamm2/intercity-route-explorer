import { describe, expect, it } from "vitest";
import { coordinatesForSegment, findDirectedSegment, findRoutesBetween } from "./route-search";

const outbound = {
  id: "outbound",
  agency: "Example Coach",
  name: "Alpha to Delta",
  weeklyTrips: 14,
  stops: ["a", "b", "c", "d"],
  segments: [
    [[-90, 40], [-89, 40]],
    [[-89, 40], [-88, 40]],
    [[-88, 40], [-87, 40]],
  ],
};

describe("directed route matching", () => {
  it("matches only when the origin appears before the destination", () => {
    expect(findDirectedSegment(outbound, ["b"], ["d"])).toEqual({
      originIndex: 1,
      destinationIndex: 3,
      stopCount: 3,
    });
    expect(findDirectedSegment(outbound, ["d"], ["b"])).toBeNull();
  });

  it("matches any stop represented by an identically named place", () => {
    expect(findDirectedSegment(outbound, ["x", "b"], ["d", "y"])?.originIndex).toBe(1);
  });

  it("returns all qualifying routes sorted by weekly frequency", () => {
    const lessFrequent = { ...outbound, id: "daily", weeklyTrips: 7 };
    const origin = { id: "origin", stopIds: ["a"] };
    const destination = { id: "destination", stopIds: ["d"] };

    expect(findRoutesBetween([lessFrequent, outbound], origin, destination).map(({ route }) => route.id)).toEqual([
      "outbound",
      "daily",
    ]);
  });

  it("joins only geometry between the selected stops", () => {
    expect(coordinatesForSegment(outbound, 1, 3)).toEqual([
      [-89, 40],
      [-88, 40],
      [-87, 40],
    ]);
  });
});
