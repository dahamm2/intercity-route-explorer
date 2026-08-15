export function findDirectedSegment(route, originStopIds, destinationStopIds) {
  const origins = new Set(originStopIds);
  const destinations = new Set(destinationStopIds);
  let bestMatch = null;

  for (let originIndex = 0; originIndex < route.stops.length - 1; originIndex += 1) {
    if (!origins.has(route.stops[originIndex])) continue;

    for (
      let destinationIndex = originIndex + 1;
      destinationIndex < route.stops.length;
      destinationIndex += 1
    ) {
      if (!destinations.has(route.stops[destinationIndex])) continue;

      const candidate = {
        originIndex,
        destinationIndex,
        stopCount: destinationIndex - originIndex + 1,
      };
      if (!bestMatch || candidate.stopCount < bestMatch.stopCount) bestMatch = candidate;
      break;
    }
  }

  return bestMatch;
}

export function findRoutesBetween(routes, origin, destination) {
  if (!origin || !destination || origin.id === destination.id) return [];

  return routes
    .map((route) => {
      const segment = findDirectedSegment(route, origin.stopIds, destination.stopIds);
      return segment ? { route, ...segment } : null;
    })
    .filter(Boolean)
    .sort(
      (first, second) =>
        second.route.weeklyTrips - first.route.weeklyTrips ||
        first.route.agency.localeCompare(second.route.agency) ||
        first.route.name.localeCompare(second.route.name),
    );
}

export function coordinatesForSegment(route, originIndex, destinationIndex) {
  const coordinates = [];

  for (const segment of route.segments.slice(originIndex, destinationIndex)) {
    for (const coordinate of segment) {
      const previous = coordinates.at(-1);
      if (!previous || previous[0] !== coordinate[0] || previous[1] !== coordinate[1]) {
        coordinates.push(coordinate);
      }
    }
  }

  return coordinates;
}
