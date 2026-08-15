export function routePatternKey(route) {
  return JSON.stringify([route.agencyId, route.stops]);
}

export function groupRoutePatterns(routes) {
  const groups = new Map();

  for (const route of routes) {
    const key = routePatternKey(route);
    const existing = groups.get(key);
    const sourceNames = route.sourceNames ?? [route.name];
    const sourceRouteIds = route.sourceRouteIds ?? [route.sourceRouteId];

    if (!existing) {
      groups.set(key, {
        ...route,
        weeklyTrips: Number(route.weeklyTrips),
        sourceFeatureCount: route.sourceFeatureCount ?? 1,
        sourceNames: [...new Set(sourceNames)],
        sourceRouteIds: [...new Set(sourceRouteIds)],
      });
      continue;
    }

    existing.weeklyTrips += Number(route.weeklyTrips);
    existing.sourceFeatureCount += route.sourceFeatureCount ?? 1;
    existing.sourceNames = [...new Set([...existing.sourceNames, ...sourceNames])];
    existing.sourceRouteIds = [...new Set([...existing.sourceRouteIds, ...sourceRouteIds])];
  }

  return [...groups.values()].map((route) => {
    const { patternName, sourceRouteId, ...groupedRoute } = route;
    return {
      ...groupedRoute,
      name: route.sourceNames.length === 1 ? route.sourceNames[0] : patternName,
    };
  });
}
