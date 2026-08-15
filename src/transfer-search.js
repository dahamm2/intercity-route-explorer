import { distanceKilometers } from "./place-grouping.js";

const DEFAULT_LIMIT = 10;
const MAX_DETOUR_RATIO = 3;

function firstIndex(stops, ids) {
  for (let index = 0; index < stops.length; index += 1) {
    if (ids.has(stops[index])) return index;
  }
  return -1;
}

function lastIndex(stops, ids) {
  for (let index = stops.length - 1; index >= 0; index -= 1) {
    if (ids.has(stops[index])) return index;
  }
  return -1;
}

function placeCentroid(place, stopsById) {
  if (place.coordinates) return place.coordinates;
  const coordinates = place.stopIds
    .map((stopId) => stopsById?.get(stopId)?.coordinates)
    .filter(Boolean);
  if (coordinates.length === 0) return [0, 0];
  return coordinates
    .reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0])
    .map((value) => value / coordinates.length);
}

function detourRatio(origin, hub, destination, stopsById) {
  const originPoint = placeCentroid(origin, stopsById);
  const hubPoint = placeCentroid(hub, stopsById);
  const destinationPoint = placeCentroid(destination, stopsById);
  const direct = distanceKilometers(originPoint, destinationPoint);
  const via =
    distanceKilometers(originPoint, hubPoint) + distanceKilometers(hubPoint, destinationPoint);
  if (direct < 1) return via;
  return via / direct;
}

export function findTransferItineraries(routes, origin, destination, places, options = {}) {
  if (!origin || !destination || origin.id === destination.id) return [];

  const limit = options.limit ?? DEFAULT_LIMIT;
  const stopsById = options.stopsById;
  const stopToCity = new Map();
  for (const place of places) {
    if (place.kind && place.kind !== "city") continue;
    for (const stopId of place.stopIds) stopToCity.set(stopId, place);
  }

  const originStops = new Set(origin.stopIds);
  const destinationStops = new Set(destination.stopIds);
  const firstLegsByHub = new Map();

  for (const route of routes) {
    const originIndex = firstIndex(route.stops, originStops);
    if (originIndex === -1) continue;
    const seenHubs = new Set();
    for (let index = originIndex + 1; index < route.stops.length; index += 1) {
      if (destinationStops.has(route.stops[index])) break;
      const hub = stopToCity.get(route.stops[index]);
      if (!hub || hub.id === origin.id || hub.id === destination.id || seenHubs.has(hub.id)) continue;
      seenHubs.add(hub.id);
      const legs = firstLegsByHub.get(hub.id) ?? [];
      legs.push({
        route,
        originIndex,
        destinationIndex: index,
        stopCount: index - originIndex + 1,
        hubStopId: route.stops[index],
      });
      firstLegsByHub.set(hub.id, legs);
    }
  }

  const itineraries = [];
  for (const route of routes) {
    const destinationIndex = lastIndex(route.stops, destinationStops);
    if (destinationIndex <= 0) continue;
    const seenHubs = new Set();
    for (let index = destinationIndex - 1; index >= 0; index -= 1) {
      if (originStops.has(route.stops[index])) break;
      const hub = stopToCity.get(route.stops[index]);
      if (!hub || !firstLegsByHub.has(hub.id) || seenHubs.has(hub.id)) continue;
      seenHubs.add(hub.id);
      for (const firstLeg of firstLegsByHub.get(hub.id)) {
        if (firstLeg.route.id === route.id) continue;
        itineraries.push({
          hub,
          sameStop: firstLeg.hubStopId === route.stops[index],
          detour: detourRatio(origin, hub, destination, stopsById),
          firstLeg,
          secondLeg: {
            route,
            originIndex: index,
            destinationIndex,
            stopCount: destinationIndex - index + 1,
            hubStopId: route.stops[index],
          },
        });
      }
    }
  }

  const scored = itineraries.sort((first, second) => {
    if (first.sameStop !== second.sameStop) return first.sameStop ? -1 : 1;
    const firstScore = Math.min(first.firstLeg.route.weeklyTrips, first.secondLeg.route.weeklyTrips);
    const secondScore = Math.min(second.firstLeg.route.weeklyTrips, second.secondLeg.route.weeklyTrips);
    return (
      first.detour - second.detour ||
      secondScore - firstScore ||
      first.hub.name.localeCompare(second.hub.name)
    );
  });

  const reasonable = scored.filter((item) => item.detour <= MAX_DETOUR_RATIO);
  const pool = reasonable.length > 0 ? reasonable : scored;

  const unique = [];
  const seen = new Set();
  for (const itinerary of pool) {
    const key = `${itinerary.hub.id}|${itinerary.firstLeg.route.id}|${itinerary.secondLeg.route.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(itinerary);
    if (unique.length >= limit) break;
  }
  return unique;
}
