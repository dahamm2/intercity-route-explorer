import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cityBaseName } from "./place-grouping";
import { createPlaceLookup, filterCitySuggestions, resolvePlaceValue } from "./place-search";
import { findRoutesBetween } from "./route-search";
import { findTransferItineraries } from "./transfer-search";

const network = JSON.parse(
  readFileSync(new URL("../public/data/network.json", import.meta.url), "utf8"),
);
const stopsById = new Map(network.stops.map((stop) => [stop.id, stop]));

function city(name) {
  return network.places.find(
    (place) =>
      place.kind === "city" && (place.name === name || cityBaseName(place.name) === name),
  );
}

function matchSummary(match) {
  return {
    agency: match.route.agency,
    name: match.route.name,
    weeklyTrips: match.route.weeklyTrips,
    stops: match.route.stops
      .slice(match.originIndex, match.destinationIndex + 1)
      .map((id) => stopsById.get(id)?.name),
  };
}

describe("generated network city search regression", () => {
  it("exposes exactly one Champaign city suggestion and no station pile", () => {
    const suggestions = filterCitySuggestions(network.places, "champ");
    const exact = suggestions.filter((place) => place.name === "Champaign, IL");
    const lookup = createPlaceLookup(network.places);

    expect(network.places.every((place) => place.kind === "city")).toBe(true);
    expect(exact).toHaveLength(1);
    expect(suggestions.filter((place) => /^Champaign/.test(place.name))).toHaveLength(1);
    expect(suggestions.some((place) => /station/i.test(place.query))).toBe(false);
    expect(resolvePlaceValue(lookup, "Champaign")).toEqual(expect.objectContaining({ name: "Champaign, IL" }));
    expect(exact[0].stationNames).toEqual(
      expect.arrayContaining(["Champaign", "Champaign Intermodal Trans Ctr", "Illinois Terminal"]),
    );
  });

  it("lists only real cities for an or query and never compass clones", () => {
    const suggestions = filterCitySuggestions(network.places, "or");
    const orangePlaces = network.places.filter((place) => /orange/i.test(place.name));

    expect(suggestions.every((place) => !/Ave|Parking Lot|Plaza|Medical|RedCoach/i.test(place.name))).toBe(
      true,
    );
    expect(suggestions.every((place) => !/\((north|south)\)/i.test(place.name))).toBe(true);
    expect(network.places.every((place) => !/\((north|south)\)/i.test(place.name))).toBe(true);
    expect(orangePlaces.every((place) => /^Orange(burg)?, [A-Z]{2}$/.test(place.name))).toBe(true);
    expect(orangePlaces.map((place) => place.name)).toEqual(
      expect.arrayContaining(["Orange, LA", "Orangeburg, SC"]),
    );
    expect(suggestions.some((place) => /^Orange(burg)?, [A-Z]{2}$/.test(place.name))).toBe(true);
    expect(city("Orangeburg")?.stationNames).toEqual(expect.arrayContaining(["Orangeburg (Love's)"]));
  });

  it("exposes exactly one Hartford, CT city covering its street-level stations", () => {
    const suggestions = filterCitySuggestions(network.places, "hart");
    const hartfordSuggestions = suggestions.filter((place) => /^Hartford,/.test(place.name));
    const hartfordCt = hartfordSuggestions.filter((place) => place.name === "Hartford, CT");

    expect(hartfordCt).toHaveLength(1);
    expect(hartfordSuggestions).toHaveLength(1);
    expect(hartfordCt[0].stationNames.length).toBeGreaterThan(1);
    expect(hartfordCt[0].stationNames).toEqual(
      expect.arrayContaining(["Hartford - Asylum and Union St", "Hartford (Union Station)"]),
    );
    expect(suggestions.some((place) => /Asylum|Pearl|Central Row|Market and Talcott/.test(place.name))).toBe(
      false,
    );
  });

  it("exposes exactly one Chicago city suggestion and no station pile", () => {
    const suggestions = filterCitySuggestions(network.places, "chicago");
    const exact = suggestions.filter((place) => place.name === "Chicago, IL");

    expect(exact).toHaveLength(1);
    expect(suggestions.filter((place) => /^Chicago,/.test(place.name))).toHaveLength(1);
    expect(suggestions.some((place) => /bus station|train station|downtown chicago/i.test(place.name))).toBe(
      false,
    );
    expect(exact[0].stopIds.map((id) => stopsById.get(id)?.coordinates)).not.toContainEqual([
      -90.5776, 41.52029,
    ]);
    expect(exact[0].stationNames).toEqual(
      expect.arrayContaining(["Downtown Chicago", "O'Hare Terminal 2 Departures"]),
    );
  });

  it("finds directed Champaign to Chicago service across station variants", () => {
    const origin = city("Champaign");
    const destination = city("Chicago");
    const matches = findRoutesBetween(network.routes, origin, destination);
    const summaries = matches.map(matchSummary);

    expect(matches.length).toBeGreaterThan(0);
    expect(summaries.some((item) => /peoria charter/i.test(item.agency))).toBe(true);
    expect(
      summaries.filter((item) => item.agency === "FlixBus-us" && item.name === "Chicago - St Louis - Atlanta"),
    ).not.toHaveLength(0);
    expect(summaries).toEqual(
      expect.arrayContaining([
        {
          agency: "FlixBus-us",
          name: "Chicago - St Louis - Memphis",
          weeklyTrips: 7,
          stops: ["Champaign Intermodal Trans Ctr", "Chicago Bus Station"],
        },
        {
          agency: "Greyhound-us",
          name: "Chicago - Bloomington - Danville",
          weeklyTrips: 7,
          stops: [
            "Champaign Intermodal Trans Ctr",
            "Bloomington",
            "Oglesby (McDonald's)",
            "Rochelle (Petro Rochelle Travel)",
            "Rockford(East Side Transfer Center)",
            "Chicago Bus Station",
          ],
        },
      ]),
    );
  });

  it("preserves direction and grouped weekly totals", () => {
    const matches = findRoutesBetween(network.routes, city("Champaign"), city("Chicago"));

    expect(matches.every((match) => match.originIndex < match.destinationIndex)).toBe(true);
    expect(matches.reduce((total, match) => total + match.route.weeklyTrips, 0)).toBeGreaterThanOrEqual(28);
    expect(network.stats.totalGroupedWeeklyTrips).toBe(network.stats.totalSourceWeeklyTrips);
  });

  it("returns one-transfer options when no direct directed service exists", () => {
    const origin = city("Abilene") ?? filterCitySuggestions(network.places, "Abilene")[0];
    const destination = city("Albuquerque") ?? filterCitySuggestions(network.places, "Albuquerque")[0];
    const directs = findRoutesBetween(network.routes, origin, destination);
    const transfers = findTransferItineraries(network.routes, origin, destination, network.places, {
      stopsById,
    });

    expect(origin?.kind).toBe("city");
    expect(destination?.kind).toBe("city");
    expect(directs).toEqual([]);
    expect(transfers.length).toBeGreaterThan(0);
    expect(transfers.every((item) => item.firstLeg.originIndex < item.firstLeg.destinationIndex)).toBe(true);
    expect(transfers.every((item) => item.secondLeg.originIndex < item.secondLeg.destinationIndex)).toBe(true);
    expect(transfers.some((item) => item.hub.name === "El Paso" || /el paso/i.test(item.hub.name))).toBe(true);
  });
});
