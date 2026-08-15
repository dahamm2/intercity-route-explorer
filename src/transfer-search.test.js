import { describe, expect, it } from "vitest";
import { findTransferItineraries } from "./transfer-search";

const origin = {
  id: "c-a",
  name: "Alpha",
  kind: "city",
  stopIds: ["a"],
  coordinates: [-90, 40],
};
const hub = {
  id: "c-h",
  name: "Hub City",
  kind: "city",
  stopIds: ["h", "h2"],
  coordinates: [-89, 40],
};
const destination = {
  id: "c-b",
  name: "Beta",
  kind: "city",
  stopIds: ["b"],
  coordinates: [-88, 40],
};
const firstLeg = {
  id: "leg-1",
  agency: "North Coach",
  name: "Alpha to Hub",
  weeklyTrips: 14,
  stops: ["a", "x", "h"],
};
const secondLeg = {
  id: "leg-2",
  agency: "South Coach",
  name: "Hub to Beta",
  weeklyTrips: 7,
  stops: ["h", "y", "b"],
};
const throughRoute = {
  id: "through",
  agency: "Through Coach",
  name: "Alpha to Beta",
  weeklyTrips: 3,
  stops: ["a", "h", "b"],
};

describe("one-transfer itineraries", () => {
  it("connects two directed legs that share a hub city", () => {
    const itineraries = findTransferItineraries(
      [firstLeg, secondLeg],
      origin,
      destination,
      [origin, hub, destination],
    );

    expect(itineraries).toHaveLength(1);
    expect(itineraries[0].hub.name).toBe("Hub City");
    expect(itineraries[0].sameStop).toBe(true);
    expect(itineraries[0].firstLeg.route.id).toBe("leg-1");
    expect(itineraries[0].secondLeg.route.id).toBe("leg-2");
  });

  it("does not invent a transfer from a single through route", () => {
    expect(
      findTransferItineraries([throughRoute], origin, destination, [origin, hub, destination]),
    ).toEqual([]);
  });

  it("does not connect cities that never share a hub", () => {
    const elsewhere = { ...hub, id: "c-z", name: "Elsewhere", stopIds: ["z"], coordinates: [-80, 35] };
    const disconnected = { ...secondLeg, id: "other", stops: ["z", "b"] };

    expect(
      findTransferItineraries(
        [firstLeg, disconnected],
        origin,
        destination,
        [origin, hub, elsewhere, destination],
      ),
    ).toEqual([]);
  });

  it("allows a same-city hub even when the physical stops differ", () => {
    const arriving = { ...firstLeg, stops: ["a", "h"] };
    const departing = { ...secondLeg, id: "leg-2b", stops: ["h2", "b"] };
    const itineraries = findTransferItineraries(
      [arriving, departing],
      origin,
      destination,
      [origin, hub, destination],
    );

    expect(itineraries).toHaveLength(1);
    expect(itineraries[0].sameStop).toBe(false);
    expect(itineraries[0].firstLeg.hubStopId).toBe("h");
    expect(itineraries[0].secondLeg.hubStopId).toBe("h2");
  });
});
