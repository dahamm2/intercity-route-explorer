import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlaces } from "../src/place-grouping.js";
import { groupRoutePatterns, routePatternKey } from "../src/route-grouping.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(ROOT, "intercity_GeoJSON_dataset.geojson");
const OUTPUT = resolve(ROOT, "public", "data", "network.json");
const SIMPLIFICATION_TOLERANCE = 0.0025;

/**
 * Streams the top-level GeoJSON features without loading the roughly 13-million
 * line source file into memory. The source is deliberately kept as the project
 * source of truth; this script creates the browser-sized derived artifact.
 */
async function* streamFeatures(filePath) {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  let foundFeatures = false;
  let collecting = false;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let featureText = "";
  let prefix = "";

  for await (const chunk of stream) {
    let index = 0;

    if (!foundFeatures) {
      prefix += chunk;
      const featuresMatch = /"features"\s*:\s*\[/.exec(prefix);
      if (!featuresMatch) {
        prefix = prefix.slice(-64);
        continue;
      }
      foundFeatures = true;
      index = featuresMatch.index + featuresMatch[0].length;
      prefix = "";
    }

    for (; index < chunk.length; index += 1) {
      const character = chunk[index];

      if (!collecting) {
        if (character === "{") {
          collecting = true;
          depth = 1;
          inString = false;
          escaped = false;
          featureText = "{";
        } else if (character === "]") {
          return;
        }
        continue;
      }

      featureText += character;

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === '"') {
          inString = false;
        }
        continue;
      }

      if (character === '"') {
        inString = true;
      } else if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
        if (depth === 0) {
          yield JSON.parse(featureText);
          collecting = false;
          featureText = "";
        }
      }
    }
  }

  if (collecting) {
    throw new Error("GeoJSON ended while reading a feature.");
  }
}

function routeKey(agencyId, routeId) {
  return `${agencyId}:${routeId}`;
}

function membershipKey(agencyId, routeId, stopId) {
  return `${routeKey(agencyId, routeId)}:${stopId}`;
}

function squaredDistance(first, second) {
  const latitudeScale = Math.cos((((first[1] + second[1]) / 2) * Math.PI) / 180);
  const dx = (first[0] - second[0]) * latitudeScale;
  const dy = first[1] - second[1];
  return dx * dx + dy * dy;
}

function nearestOrderedIndexes(coordinates, stops) {
  if (coordinates.length === 0 || stops.length === 0) return [];

  const indexes = [];
  let minimumIndex = 0;

  for (let stopIndex = 0; stopIndex < stops.length; stopIndex += 1) {
    const stopCoordinate = stops[stopIndex].coordinates;
    let nearestIndex = minimumIndex;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let coordinateIndex = minimumIndex; coordinateIndex < coordinates.length; coordinateIndex += 1) {
      const distance = squaredDistance(coordinates[coordinateIndex], stopCoordinate);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = coordinateIndex;
      }
    }

    indexes.push(nearestIndex);
    minimumIndex = nearestIndex;
  }

  return indexes;
}

function perpendicularDistanceSquared(point, start, end) {
  const latitudeScale = Math.cos((((start[1] + end[1]) / 2) * Math.PI) / 180);
  const startX = start[0] * latitudeScale;
  const pointX = point[0] * latitudeScale;
  const endX = end[0] * latitudeScale;
  const dx = endX - startX;
  const dy = end[1] - start[1];

  if (dx === 0 && dy === 0) return squaredDistance(point, start);

  const progress = Math.max(
    0,
    Math.min(1, ((pointX - startX) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)),
  );
  const projected = [startX + progress * dx, start[1] + progress * dy];
  const projectedDx = pointX - projected[0];
  const projectedDy = point[1] - projected[1];
  return projectedDx * projectedDx + projectedDy * projectedDy;
}

function simplifyLine(points, tolerance = SIMPLIFICATION_TOLERANCE) {
  if (points.length <= 2) return points;

  const toleranceSquared = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const ranges = [[0, points.length - 1]];

  while (ranges.length > 0) {
    const [startIndex, endIndex] = ranges.pop();
    let furthestIndex = -1;
    let furthestDistance = toleranceSquared;

    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = perpendicularDistanceSquared(points[index], points[startIndex], points[endIndex]);
      if (distance > furthestDistance) {
        furthestDistance = distance;
        furthestIndex = index;
      }
    }

    if (furthestIndex !== -1) {
      keep[furthestIndex] = 1;
      ranges.push([startIndex, furthestIndex], [furthestIndex, endIndex]);
    }
  }

  return points.filter((_, index) => keep[index]);
}

function roundedCoordinate(coordinate) {
  return coordinate.map((value) => Number(value.toFixed(5)));
}

function buildSegments(routeCoordinates, stops) {
  if (stops.length < 2) return [];

  const indexes = nearestOrderedIndexes(routeCoordinates, stops);
  return indexes.slice(0, -1).map((startIndex, segmentIndex) => {
    const endIndex = indexes[segmentIndex + 1];
    const source = routeCoordinates.slice(startIndex, Math.max(startIndex + 1, endIndex + 1));
    if (source.length === 1) source.push(stops[segmentIndex + 1].coordinates);
    source[0] = stops[segmentIndex].coordinates;
    source[source.length - 1] = stops[segmentIndex + 1].coordinates;
    return simplifyLine(source).map(roundedCoordinate);
  });
}

function jsonWrite(stream, value) {
  return new Promise((resolveWrite) => {
    const text = JSON.stringify(value);
    if (stream.write(text)) {
      resolveWrite();
      return;
    }
    stream.once("drain", resolveWrite);
  });
}

async function prepareData() {
  let sourceInfo;
  try {
    sourceInfo = await stat(SOURCE);
  } catch {
    try {
      const existing = await stat(OUTPUT);
      console.log(
        `Source GeoJSON not found at ${SOURCE}. Using existing ${OUTPUT} (${existing.size} bytes).`,
      );
      return;
    } catch {
      throw new Error(
        `Cannot build network data: missing ${SOURCE} and ${OUTPUT}.`,
      );
    }
  }
  const allStops = [];
  const membershipToStop = new Map();
  const sourceIdToStops = new Map();
  let routeCount = 0;

  console.log("Pass 1/2: indexing stops and route memberships...");
  for await (const feature of streamFeatures(SOURCE)) {
    const properties = feature.properties ?? {};
    if (properties.feature_type === "route") {
      routeCount += 1;
      continue;
    }
    if (properties.feature_type !== "stop" || feature.geometry?.type !== "Point") continue;

    const city = [
      properties.city,
      properties.stop_city,
      properties.municipality,
      properties.locality,
    ].find((value) => typeof value === "string" && value.trim());
    const stop = {
      id: `s${allStops.length}`,
      sourceId: String(properties.stop_id),
      name: String(properties.stop_name || "Unnamed stop"),
      city: city?.trim(),
      agency: String(properties.agency_name || "Unknown agency"),
      coordinates: roundedCoordinate(feature.geometry.coordinates),
      routeRefs: Array.isArray(properties.routes) ? properties.routes : [],
    };
    allStops.push(stop);

    const sameSourceId = sourceIdToStops.get(stop.sourceId) ?? [];
    sameSourceId.push(stop);
    sourceIdToStops.set(stop.sourceId, sameSourceId);

    for (const reference of stop.routeRefs) {
      membershipToStop.set(membershipKey(reference.agency_id, reference.route_id, stop.sourceId), stop);
    }
  }

  let unresolvedStopReferences = 0;
  let usableRouteFeatureCount = 0;
  const referencedStops = new Set();
  const skippedRoutes = [];
  const routeFeatures = [];

  console.log("Pass 2/2: resolving ordered routes and simplifying geometry...");
  for await (const feature of streamFeatures(SOURCE)) {
    const properties = feature.properties ?? {};
    if (properties.feature_type !== "route") continue;
    if (feature.geometry?.type !== "LineString") {
      skippedRoutes.push({
        agencyId: properties.agency_id,
        routeId: properties.route_id,
        reason: `Unsupported ${feature.geometry?.type ?? "missing"} geometry`,
      });
      continue;
    }

    const stopIds = Array.isArray(properties.stops) ? properties.stops.map(String) : [];
    const stops = [];

    for (const sourceStopId of stopIds) {
      let stop = membershipToStop.get(
        membershipKey(properties.agency_id, properties.route_id, sourceStopId),
      );

      if (!stop) {
        const candidates = sourceIdToStops.get(sourceStopId) ?? [];
        stop =
          candidates.find((candidate) => candidate.agency === properties.agency_name) ??
          (candidates.length === 1 ? candidates[0] : undefined);
      }

      if (stop) {
        stops.push(stop);
        referencedStops.add(stop.id);
      } else {
        unresolvedStopReferences += 1;
      }
    }

    if (stops.length < 2) {
      skippedRoutes.push({
        agencyId: properties.agency_id,
        routeId: properties.route_id,
        reason: `Only ${stops.length} resolvable ordered stop${stops.length === 1 ? "" : "s"}`,
      });
      continue;
    }

    const route = {
      sourceRouteId: properties.route_id,
      agencyId: properties.agency_id,
      agency: String(properties.agency_name || "Unknown agency"),
      name: String(properties.route_long_name || `Route ${properties.route_id}`),
      patternName: `${stops[0].name} → ${stops.at(-1).name}`,
      weeklyTrips: Number(properties.weekly_trips),
      stops: stops.map((stop) => stop.id),
      segments: buildSegments(feature.geometry.coordinates, stops),
    };

    routeFeatures.push(route);
    usableRouteFeatureCount += 1;
  }

  const routes = groupRoutePatterns(routeFeatures).map((route, index) => ({
    ...route,
    id: `r${index}`,
  }));
  const totalSourceWeeklyTrips = routeFeatures.reduce(
    (total, route) => total + route.weeklyTrips,
    0,
  );
  const totalGroupedWeeklyTrips = routes.reduce((total, route) => total + route.weeklyTrips, 0);
  const stops = allStops.filter((stop) => referencedStops.has(stop.id));
  const places = buildPlaces(stops);

  const duplicatePatternGroups = routes.filter((route) => route.sourceFeatureCount > 1);
  const sourceFeaturesInGroupedResults = duplicatePatternGroups.reduce(
    (total, route) => total + route.sourceFeatureCount,
    0,
  );

  await mkdir(dirname(OUTPUT), { recursive: true });
  const output = createWriteStream(OUTPUT, { encoding: "utf8" });
  output.write('{"metadata":');
  await jsonWrite(output, {
    generatedAt: new Date().toISOString(),
    sourceFile: "intercity_GeoJSON_dataset.geojson",
    sourceBytes: sourceInfo.size,
    directionMethod:
      "The source route feature's ordered stops array defines travel direction; a match requires origin before destination.",
    groupingMethod:
      "Source route features are grouped only when agency_id and the complete ordered stop sequence are identical. Reversed stop orders remain separate directional results.",
    frequencyMethod:
      "Each grouped result's weeklyTrips is the sum of weekly_trips across all source route features in that operator and ordered-stop-pattern group.",
    placeMethod:
      "Searchable places are unique cities labeled with an evidence-based state or province. City/locality source fields are used when present. Otherwise a city label is inferred from the station name, known transit landmarks, then nearby same-label stops are merged. Street, venue, and facility names are not searchable origins; they attach to a nearby city when one is close enough. Distant same-name clusters in different states stay separate. Same-state splits keep one primary city name and never invent compass clones. Selecting a city searches every station assigned to that city.",
    locationLimitation:
      "Inferred cities are evidence-based station groups, not authoritative municipal boundaries. Same names in different states are treated as different cities. Street, venue, and generic stops attach to a nearby city when one exists; otherwise they remain on routes but are not listed as search suggestions.",
    simplificationToleranceDegrees: SIMPLIFICATION_TOLERANCE,
  });
  output.write(',"routes":');
  await jsonWrite(output, routes);
  output.write(',"stops":');
  await jsonWrite(
    output,
    stops.map((stop) => ({
      id: stop.id,
      sourceId: stop.sourceId,
      name: stop.name,
      ...(stop.city ? { city: stop.city } : {}),
      agency: stop.agency,
      coordinates: stop.coordinates,
    })),
  );
  output.write(',"places":');
  await jsonWrite(output, places);
  output.write(
    `,"stats":${JSON.stringify({
      sourceRoutes: routeCount,
      usableRouteFeatures: usableRouteFeatureCount,
      exportedRouteGroups: routes.length,
      duplicatePatternGroups: duplicatePatternGroups.length,
      sourceFeaturesInGroupedResults,
      aggregatedFeatureReduction: usableRouteFeatureCount - routes.length,
      totalSourceWeeklyTrips,
      totalGroupedWeeklyTrips,
      sourceStops: allStops.length,
      exportedStops: stops.length,
      searchablePlaces: places.length,
      unresolvedStopReferences,
      skippedRoutes,
    })}`,
  );
  output.end("}");

  await new Promise((resolveFinish, rejectFinish) => {
    output.on("finish", resolveFinish);
    output.on("error", rejectFinish);
  });

  const generatedData = JSON.parse(await readFile(OUTPUT, "utf8"));
  const generatedPatternKeys = generatedData.routes.map(routePatternKey);
  if (
    generatedData.routes.length !== routes.length ||
    new Set(generatedPatternKeys).size !== generatedPatternKeys.length ||
    generatedData.stats.totalSourceWeeklyTrips !== generatedData.stats.totalGroupedWeeklyTrips ||
    generatedData.stops.length !== stops.length ||
    generatedData.places.length !== places.length
  ) {
    throw new Error("Generated network failed its record-count validation.");
  }

  console.log(
    `Wrote ${routes.length} grouped routes from ${usableRouteFeatureCount} usable source features, ${stops.length} referenced stops, and ${places.length} searchable places to ${OUTPUT}.`,
  );
  if (unresolvedStopReferences > 0) {
    console.warn(`${unresolvedStopReferences} route stop references could not be resolved.`);
  }
}

prepareData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
