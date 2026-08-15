import { describe, expect, it } from "vitest";
import { buildPlaces, candidateCityLabel } from "./place-grouping";
import { filterCitySuggestions } from "./place-search";

function stop(id, name, coordinates, overrides = {}) {
  return {
    id,
    name,
    coordinates,
    agency: "Example Coach",
    ...overrides,
  };
}

describe("city-level place grouping", () => {
  it("uses an explicit source city when available", () => {
    const places = buildPlaces([
      stop("a", "Central Terminal", [-88.24, 40.11], { city: "Champaign" }),
      stop("b", "Campus Stop", [-88.23, 40.1], { city: "Champaign" }),
    ]);
    const city = places.find((place) => place.name === "Champaign, IL");

    expect(places.every((place) => place.kind === "city")).toBe(true);
    expect(city?.stopIds).toEqual(["a", "b"]);
  });

  it("merges nearby same-city stations into one searchable city", () => {
    const places = buildPlaces([
      stop("champaign", "Champaign", [-88.24146, 40.11566]),
      stop("intermodal", "Champaign Intermodal Trans Ctr", [-88.242004, 40.11539]),
      stop("chicago", "Chicago", [-87.6435, 41.8748]),
      stop("downtown", "Downtown Chicago", [-87.64, 41.88]),
      stop("bad-coordinate", "Chicago Bus Station", [-90.5776, 41.52029]),
    ]);

    const champaign = places.filter((place) => place.name === "Champaign, IL");
    const chicago = places.filter((place) => place.name === "Chicago, IL");

    expect(champaign).toHaveLength(1);
    expect(champaign[0].stopIds).toEqual(["champaign", "intermodal"]);
    expect(chicago).toHaveLength(1);
    expect(chicago[0].stopIds).toEqual(["chicago", "downtown"]);
    expect(chicago[0].stopIds).not.toContain("bad-coordinate");
    expect(places.some((place) => place.kind === "station")).toBe(false);
  });

  it("does not list individual stations as search suggestions", () => {
    const places = buildPlaces([
      stop("city", "Champaign", [-88.24146, 40.11566]),
      stop("terminal", "Champaign Intermodal Trans Ctr", [-88.242004, 40.11539]),
    ]);

    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({ kind: "city", name: "Champaign, IL", query: "Champaign, IL" });
  });

  it("disambiguates same city names that are clearly different places", () => {
    const places = buildPlaces([
      stop("il", "Springfield SMTD Transfer Center", [-89.64103, 39.80069]),
      stop("mo", "Springfield", [-93.29909, 37.20937]),
      stop("mo-cu", "Springfield CU Transit Center", [-93.29688, 37.20943]),
    ]);

    const names = places.map((place) => place.name).sort();
    expect(names).toEqual(["Springfield, IL", "Springfield, MO"]);
    expect(places.find((place) => place.name === "Springfield, IL")?.stopIds).toEqual(["il"]);
    expect(places.find((place) => place.name === "Springfield, MO")?.stopIds).toEqual(["mo", "mo-cu"]);
  });

  it("extracts a city label from common station-name patterns", () => {
    expect(candidateCityLabel("Chicago Bus Station")).toBe("Chicago");
    expect(candidateCityLabel("Downtown Chicago")).toBe("Chicago");
    expect(candidateCityLabel("Champaign Intermodal Trans Ctr")).toBe("Champaign");
    expect(candidateCityLabel("Abilene (7-Eleven)")).toBe("Abilene");
    expect(candidateCityLabel("Hartford - Asylum and Union St")).toBe("Hartford");
    expect(candidateCityLabel("Hartford - Asylum St. at Bushnell Park")).toBe("Hartford");
    expect(candidateCityLabel("Houston - Downtown")).toBe("Houston");
    expect(candidateCityLabel("Winston-Salem Bus Station")).toBe("Winston-Salem");
    expect(candidateCityLabel("Illinois Terminal")).toBeNull();
    expect(candidateCityLabel("ISR")).toBeNull();
    expect(candidateCityLabel("O'Hare Terminal 2 Departures")).toBeNull();
    expect(candidateCityLabel("Orange Ave")).toBeNull();
    expect(candidateCityLabel("Orange Medical Pavillion Parking Lot")).toBeNull();
    expect(candidateCityLabel("Orange Plaza")).toBeNull();
    expect(candidateCityLabel("Main St")).toBeNull();
    expect(candidateCityLabel("Bradley University")).toBeNull();
    expect(candidateCityLabel("Orange")).toBe("Orange");
    expect(candidateCityLabel("Orangeburg")).toBe("Orangeburg");
    expect(candidateCityLabel("Dodge Center")).toBe("Dodge Center");
    expect(candidateCityLabel("St Louis")).toBe("St Louis");
    expect(candidateCityLabel("Orlando RedCoach Station")).toBe("Orlando");
    expect(candidateCityLabel("Gastonia Transit")).toBe("Gastonia");
  });

  it("keeps real Orange cities and drops streets, venues, and compass clones", () => {
    const places = buildPlaces([
      stop("la", "Orange", [-93.77991, 30.10457]),
      stop("la-exxon", "Orange (Exxon)", [-93.78, 30.105]),
      stop("nj", "Orange", [-74.232, 40.771]),
      stop("ave-near-nj", "Orange Ave", [-74.235, 40.773]),
      stop("ave-far", "Orange Ave", [-74.13674, 41.12789]),
      stop("lot", "Orange Medical Pavillion Parking Lot", [-74.36229, 41.44817]),
      stop("plaza", "Orange Plaza", [-74.3806, 41.45178]),
      stop("sc", "Orangeburg", [-80.86, 33.491]),
      stop("sc-loves", "Orangeburg (Love's)", [-80.73791, 33.4571]),
      stop("sc-far", "Orangeburg (Xpress Travel Center)", [-81.09887, 32.07967]),
    ]);

    const names = places.map((place) => place.name);
    expect(names.every((name) => !/Ave|Parking Lot|Plaza|Medical|\((north|south)\)/i.test(name))).toBe(
      true,
    );
    expect(names).toEqual(expect.arrayContaining(["Orange, LA", "Orange, NJ", "Orangeburg, SC"]));
    expect(names.filter((name) => /^Orangeburg/.test(name))).toEqual(["Orangeburg, SC"]);

    const orangeNj = places.find((place) => place.name === "Orange, NJ");
    const orangeburg = places.find((place) => place.name === "Orangeburg, SC");
    expect(orangeNj?.stationNames).toEqual(expect.arrayContaining(["Orange", "Orange Ave"]));
    expect(orangeburg?.stationNames).toEqual(
      expect.arrayContaining(["Orangeburg", "Orangeburg (Love's)"]),
    );
    expect(orangeburg?.stationNames).not.toContain("Orangeburg (Xpress Travel Center)");
    expect(places.some((place) => place.stationNames.includes("Orange Medical Pavillion Parking Lot"))).toBe(
      false,
    );

    const suggestions = filterCitySuggestions(places, "or");
    expect(suggestions.every((place) => !/Ave|Parking Lot|Plaza|Medical/i.test(place.name))).toBe(true);
    expect(suggestions.map((place) => place.name)).toEqual(
      expect.arrayContaining(["Orange, LA", "Orange, NJ", "Orangeburg, SC"]),
    );
    expect(suggestions.filter((place) => /Orangeburg/.test(place.name))).toHaveLength(1);
  });

  it("merges City - Street stops into one city and keeps distant same names separate", () => {
    const places = buildPlaces([
      stop("union", "Hartford (Union Station)", [-72.68157, 41.76882]),
      stop("asylum-union", "Hartford - Asylum and Union St", [-72.68134, 41.76786]),
      stop("bushnell", "Hartford - Asylum St. at Bushnell Park", [-72.67925, 41.76763]),
      stop("old-state", "Hartford - Central Row at Old State House", [-72.67262, 41.76566]),
      stop("pearl-ann", "Hartford - Pearl and Ann St.", [-72.67766, 41.76643]),
      stop("houston-downtown", "Houston - Downtown", [-95.3698, 29.7604]),
      stop("houston-galleria", "Houston - Galleria", [-95.461, 29.739]),
      stop("hartford-wi", "Hartford", [-88.379, 43.318]),
    ]);

    const hartfordCt = places.filter((place) => place.name === "Hartford, CT");
    const hartfordWi = places.filter((place) => place.name === "Hartford, WI");
    const houston = places.filter((place) => place.name === "Houston, TX");

    expect(hartfordCt).toHaveLength(1);
    expect(hartfordCt[0].stopIds.length).toBeGreaterThan(1);
    expect(hartfordCt[0].stationNames).toEqual(
      expect.arrayContaining([
        "Hartford (Union Station)",
        "Hartford - Asylum and Union St",
        "Hartford - Pearl and Ann St.",
      ]),
    );
    expect(places.some((place) => /Asylum|Pearl|Central Row/.test(place.name))).toBe(false);
    expect(hartfordWi).toHaveLength(1);
    expect(hartfordWi[0].stopIds).toEqual(["hartford-wi"]);
    expect(houston).toHaveLength(1);
    expect(houston[0].stopIds).toEqual(["houston-downtown", "houston-galleria"]);

    const hartSuggestions = filterCitySuggestions(places, "hart");
    expect(hartSuggestions.filter((place) => place.name === "Hartford, CT")).toHaveLength(1);
    expect(hartSuggestions.filter((place) => /^Hartford,/.test(place.name))).toHaveLength(2);
    expect(hartSuggestions.find((place) => place.name === "Hartford, CT")?.stationNames.length).toBeGreaterThan(1);
  });

  it("groups Peoria Charter campus and airport landmarks into Champaign and Chicago", () => {
    const places = buildPlaces([
      stop("champaign", "Champaign", [-88.24146, 40.11566]),
      stop("intermodal", "Champaign Intermodal Trans Ctr", [-88.242004, 40.11539]),
      stop("terminal", "Illinois Terminal", [-88.242004, 40.115402]),
      stop("armory", "Armory", [-88.232475, 40.10543]),
      stop("isr", "ISR", [-88.22105, 40.108963]),
      stop("chicago", "Chicago", [-87.6435, 41.8748]),
      stop("downtown", "Downtown Chicago", [-87.64397, 41.87545]),
      stop("ohare", "O'Hare Terminal 2 Departures", [-87.8808, 41.979618]),
      stop("ord", "O'Hare Multi-Modal Facility", [-87.882645, 41.993237]),
      stop("midway", "Midway Airport Arrival", [-87.73962, 41.78838]),
    ]);

    const champaign = places.filter((place) => place.name === "Champaign, IL");
    const chicago = places.filter((place) => place.name === "Chicago, IL");

    expect(champaign).toHaveLength(1);
    expect(champaign[0].stationNames).toEqual(
      expect.arrayContaining(["Armory", "Champaign", "Champaign Intermodal Trans Ctr", "Illinois Terminal", "ISR"]),
    );
    expect(chicago).toHaveLength(1);
    expect(chicago[0].stationNames).toEqual(
      expect.arrayContaining([
        "Chicago",
        "Downtown Chicago",
        "Midway Airport Arrival",
        "O'Hare Multi-Modal Facility",
        "O'Hare Terminal 2 Departures",
      ]),
    );
  });
});
