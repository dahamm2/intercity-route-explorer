import { describe, expect, it } from "vitest";
import {
  createPlaceLookup,
  filterCitySuggestions,
  placeSuggestionLabel,
  resolvePlaceValue,
} from "./place-search";

const city = {
  id: "city",
  name: "Champaign, IL",
  query: "Champaign, IL",
  kind: "city",
  stopIds: ["a", "b"],
  stationNames: ["Champaign", "Champaign Intermodal Trans Ctr"],
};
const chicago = {
  id: "chicago",
  name: "Chicago, IL",
  query: "Chicago, IL",
  kind: "city",
  stopIds: ["c"],
  stationNames: ["Chicago", "Chicago Bus Station"],
};
const springfieldIl = {
  id: "springfield-il",
  name: "Springfield, IL",
  query: "Springfield, IL",
  kind: "city",
  stopIds: ["d"],
  stationNames: ["Springfield SMTD Transfer Center"],
};
const springfieldMo = {
  id: "springfield-mo",
  name: "Springfield, MO",
  query: "Springfield, MO",
  kind: "city",
  stopIds: ["e"],
  stationNames: ["Springfield"],
};

describe("place input resolution", () => {
  it("resolves a typed exact city regardless of case or surrounding whitespace", () => {
    const lookup = createPlaceLookup([city, chicago]);

    expect(resolvePlaceValue(lookup, "  cHaMpAiGn  ")).toBe(city);
    expect(resolvePlaceValue(lookup, "Champaign, IL")).toBe(city);
  });

  it("resolves a unique station name to its parent city", () => {
    const lookup = createPlaceLookup([city, chicago]);

    expect(resolvePlaceValue(lookup, "Champaign Intermodal Trans Ctr")).toBe(city);
    expect(resolvePlaceValue(lookup, "Chicago Bus Station")).toBe(chicago);
  });

  it("explains multi-station city suggestions", () => {
    expect(placeSuggestionLabel(city)).toBe("2 stations in this city");
  });

  it("filters search suggestions to unique city names with state", () => {
    const places = [city, chicago, { ...city, id: "clone-station", kind: "station", query: "Champaign — station" }];

    const champ = filterCitySuggestions(places, "champ");
    const chicagoMatches = filterCitySuggestions(places, "chicago");

    expect(champ).toEqual([city]);
    expect(champ.filter((place) => /^Champaign/.test(place.name))).toHaveLength(1);
    expect(chicagoMatches).toEqual([chicago]);
    expect(chicagoMatches.filter((place) => /^Chicago/.test(place.name))).toHaveLength(1);
  });

  it("does not suggest street, venue, or compass-split labels", () => {
    const orangeLa = {
      id: "orange-la",
      name: "Orange, LA",
      query: "Orange, LA",
      kind: "city",
      stopIds: ["a"],
      stationNames: ["Orange"],
    };
    const orangeAve = {
      id: "orange-ave",
      name: "Orange Ave, NJ",
      query: "Orange Ave, NJ",
      kind: "city",
      stopIds: ["b"],
      stationNames: ["Orange Ave"],
    };
    const orangeNorth = {
      id: "orangeburg-north",
      name: "Orangeburg, SC (north)",
      query: "Orangeburg, SC (north)",
      kind: "city",
      stopIds: ["c"],
      stationNames: ["Orangeburg (Love's)"],
    };

    const suggestions = filterCitySuggestions([orangeLa, orangeAve, orangeNorth], "or");

    expect(suggestions.map((place) => place.name)).toEqual(["Orange, LA"]);
    expect(suggestions.every((place) => !/Ave|Parking Lot|Plaza|Medical|\((north|south)\)/i.test(place.name))).toBe(
      true,
    );
  });

  it("keeps distant same-name cities disambiguated", () => {
    const lookup = createPlaceLookup([springfieldIl, springfieldMo]);
    const suggestions = filterCitySuggestions([springfieldIl, springfieldMo], "Springfield");

    expect(resolvePlaceValue(lookup, "Springfield")).toBeUndefined();
    expect(resolvePlaceValue(lookup, "Springfield, IL")).toBe(springfieldIl);
    expect(suggestions.map((place) => place.name)).toEqual(["Springfield, IL", "Springfield, MO"]);
  });
});
