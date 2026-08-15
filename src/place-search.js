import { cityBaseName, isSearchableCityLabel, normalizePlaceName } from "./place-grouping.js";

export { cityBaseName };

const SUGGESTION_LIMIT = 8;

export function createPlaceLookup(places) {
  const lookup = new Map();
  const cities = places.filter((place) => place.kind === "city");
  const citiesByBase = new Map();

  for (const place of cities) {
    lookup.set(normalizePlaceName(place.query ?? place.name), place);
    lookup.set(normalizePlaceName(place.name), place);
    const base = normalizePlaceName(cityBaseName(place.name));
    if (base) {
      const owners = citiesByBase.get(base) ?? [];
      owners.push(place);
      citiesByBase.set(base, owners);
    }
  }

  for (const [base, owners] of citiesByBase) {
    if (owners.length !== 1 || lookup.has(base)) continue;
    lookup.set(base, owners[0]);
  }

  const stationOwners = new Map();
  for (const place of cities) {
    for (const stationName of place.stationNames ?? []) {
      const key = normalizePlaceName(stationName);
      if (lookup.has(key)) continue;
      const owners = stationOwners.get(key) ?? new Set();
      owners.add(place.id);
      stationOwners.set(key, owners);
    }
  }

  const citiesById = new Map(cities.map((place) => [place.id, place]));
  for (const [key, owners] of stationOwners) {
    if (owners.size !== 1) continue;
    if ((citiesByBase.get(key)?.length ?? 0) > 1) continue;
    lookup.set(key, citiesById.get([...owners][0]));
  }

  return lookup;
}

export function resolvePlaceValue(lookup, value) {
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  return (
    lookup.get(normalizePlaceName(trimmed)) ??
    lookup.get(normalizePlaceName(cityBaseName(trimmed)))
  );
}

export function placeSuggestionLabel(place) {
  const stationCount = place.stationNames?.length ?? place.stopIds.length;
  return `${stationCount} station${stationCount === 1 ? "" : "s"} in this city`;
}

function suggestionRank(place, needle) {
  const name = normalizePlaceName(place.name);
  const base = normalizePlaceName(cityBaseName(place.name));
  const query = normalizePlaceName(place.query ?? "");
  if (name === needle || base === needle || query === needle) return 0;
  if (name.startsWith(needle) || base.startsWith(needle) || query.startsWith(needle)) return 1;
  return 2;
}

export function filterCitySuggestions(places, query, limit = SUGGESTION_LIMIT) {
  const needle = normalizePlaceName(query);
  if (!needle) return [];

  return places
    .filter((place) => {
      if (place.kind !== "city" || !isSearchableCityLabel(place.name)) return false;
      const name = normalizePlaceName(place.name);
      const base = normalizePlaceName(cityBaseName(place.name));
      const queryText = normalizePlaceName(place.query ?? "");
      return name.includes(needle) || base.includes(needle) || queryText.includes(needle);
    })
    .sort(
      (first, second) =>
        suggestionRank(first, needle) - suggestionRank(second, needle) ||
        first.name.localeCompare(second.name),
    )
    .slice(0, limit);
}
