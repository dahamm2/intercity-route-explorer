import { regionCode } from "./geo-region.js";

export const CITY_CLUSTER_RADIUS_KM = 40;
const GENERIC_ATTACH_RADIUS_KM = 12;

const FACILITY_SUFFIXES = [
  "intermodal transportation center",
  "intermodal transit center",
  "intermodal trans ctr",
  "intermodal center",
  "metro downtown transit center",
  "downtown transit center",
  "downtown transit ctr",
  "transportation center",
  "transit center",
  "transfer center",
  "bus concourse",
  "bus platform",
  "bus station",
  "bus terminal",
  "bus stop",
  "train station",
  "amtrak station",
  "greyhound station",
  "union station",
  "park and ride",
  "park & ride",
  "truck stop",
  "multi-modal facility",
  "multimodal facility",
  "multi modal facility",
  "greyhound",
  "flixbus",
  "redcoach",
  "concourse",
  "platform",
  "station",
  "terminal",
  "depot",
  "airport",
  "departures",
  "arrivals",
  "departure",
  "arrival",
  "facility",
  "stop",
  "ctr",
];

const CITY_PREFIXES = [
  "downtown",
  "uptown",
  "midtown",
  "transit center",
  "transit hub",
  "amtrak station",
  "amtrak",
  "greyhound",
  "flixbus",
];

const OPERATOR_LAST_WORDS = new Set([
  "transit",
  "coach",
  "express",
  "redcoach",
  "system",
  "district",
  "hub",
]);

const STREET_LAST_WORDS = new Set([
  "ave",
  "avenue",
  "st",
  "street",
  "rd",
  "road",
  "blvd",
  "boulevard",
  "dr",
  "drive",
  "ln",
  "lane",
  "way",
  "hwy",
  "highway",
  "pkwy",
  "parkway",
  "pky",
  "plaza",
  "square",
  "ct",
  "court",
  "cir",
  "circle",
  "tpk",
  "tnpk",
  "turnpike",
  "pike",
  "fwy",
  "freeway",
  "expy",
  "expressway",
]);

const VENUE_LAST_WORDS = new Set([
  "university",
  "hospital",
  "airport",
  "hotel",
  "motel",
  "inn",
  "mall",
  "pavilion",
  "pavillion",
  "church",
  "medical",
  "lot",
  "garage",
  "campus",
  "library",
  "arena",
  "stadium",
  "museum",
  "casino",
  "resort",
  "store",
  "hub",
  "centre",
]);

const VENUE_PHRASES = [
  "parking lot",
  "parking garage",
  "park ride",
  "park-ride",
  "medical pavilion",
  "medical pavillion",
  "medical center",
  "medical centre",
  "shopping center",
  "shopping centre",
  "shopping mall",
  "community center",
  "community centre",
  "welcome center",
  "welcome centre",
  "visitor center",
  "visitor centre",
  "visitors center",
  "visitors centre",
  "travel center",
  "travel centre",
  "travel plaza",
  "student center",
  "student centre",
  "town center",
  "town centre",
  "market center",
  "market centre",
  "service center",
  "service centre",
  "service plaza",
  "art center",
  "art centre",
  "transfer centre",
  "truck center",
  "truck centre",
  "gas station",
  "filling station",
  "psychiatric center",
  "psychiatric centre",
  "commuter lot",
  "academic center",
  "academic centre",
];

const LEFTOVER_FACILITY_WORDS =
  /\b(station|gate|platform|concourse|terminal|depot|parking|pavilion|pavillion|university|hospital|hotel|motel|mall|medical|church|airport|plaza|square|transit|coach|express|redcoach|system|district)\b/i;

const GENERIC_LABELS = new Set([
  "union station",
  "bus station",
  "train station",
  "amtrak station",
  "transit center",
  "transfer center",
  "transportation center",
  "park and ride",
  "park & ride",
  "terminal",
  "station",
  "stop",
  "depot",
  "airport",
  "downtown",
  "uptown",
  "midtown",
  "greyhound",
  "flixbus",
  "armory",
  "o'hare",
  "ohare",
  "ord",
  "isr",
  "ilu",
  "bus",
  "main",
  "railroad",
  "commercial",
  "circle k",
  "flying j",
  "road ranger",
  "7-eleven",
  "7 eleven",
  "mcdonald's",
  "mcdonalds",
  "love's",
  "loves",
  "valero",
  "pilot",
  "petro",
  "exxon",
  "quiktrip",
  "ta",
]);

const REGION_CODES = new Set([
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DC",
  "DE",
  "FL",
  "GA",
  "HI",
  "IA",
  "ID",
  "IL",
  "IN",
  "KS",
  "KY",
  "LA",
  "MA",
  "MD",
  "ME",
  "MI",
  "MN",
  "MO",
  "MS",
  "MT",
  "NC",
  "ND",
  "NE",
  "NH",
  "NJ",
  "NM",
  "NV",
  "NY",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VA",
  "VT",
  "WA",
  "WI",
  "WV",
  "WY",
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "ON",
  "PE",
  "QC",
  "SK",
]);

const STATE_AND_PROVINCE_NAMES = new Set([
  "alabama",
  "alaska",
  "arizona",
  "arkansas",
  "california",
  "colorado",
  "connecticut",
  "delaware",
  "florida",
  "georgia",
  "hawaii",
  "idaho",
  "illinois",
  "indiana",
  "iowa",
  "kansas",
  "kentucky",
  "louisiana",
  "maine",
  "maryland",
  "massachusetts",
  "michigan",
  "minnesota",
  "mississippi",
  "missouri",
  "montana",
  "nebraska",
  "nevada",
  "new hampshire",
  "new jersey",
  "new mexico",
  "north carolina",
  "north dakota",
  "ohio",
  "oklahoma",
  "oregon",
  "pennsylvania",
  "rhode island",
  "south carolina",
  "south dakota",
  "tennessee",
  "texas",
  "utah",
  "vermont",
  "virginia",
  "west virginia",
  "wisconsin",
  "wyoming",
  "district of columbia",
  "alberta",
  "british columbia",
  "manitoba",
  "new brunswick",
  "newfoundland",
  "newfoundland and labrador",
  "nova scotia",
  "ontario",
  "prince edward island",
  "quebec",
  "saskatchewan",
]);

const TRANSIT_HUB_PATTERN =
  /\b(o'?hare|\bord\b|midway airport|illinois terminal|\bilu\b|\bisr\b|union station|95th|multi-?modal|airport|terminal)\b/i;

const STREET_WORD_PATTERN =
  /\b(ave|avenue|st|street|rd|road|blvd|boulevard|dr|drive|ln|lane|way|hwy|highway|pkwy|parkway|plaza|square|court|circle|tpk|turnpike)\b/i;

const COMPASS_QUALIFIER_PATTERN = /\s*\((north|south|east|west)\)$/i;

function landmarkCityLabel(name) {
  const text = String(name);
  if (/\billinois terminal\b/i.test(text)) return "Champaign";
  if (/\bo'?hare\b/i.test(text)) return "Chicago";
  if (/\bord\b/i.test(text) && /multi|facility|airport|terminal/i.test(text)) return "Chicago";
  if (/\bmidway airport\b/i.test(text)) return "Chicago";
  return null;
}

export function normalizePlaceName(name) {
  return String(name).trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function normalizeCityKey(name) {
  return normalizePlaceName(name)
    .replace(/\bst\.?\s+/g, "st ")
    .replace(/\bsaint\s+/g, "st ")
    .replace(/\bft\.?\s+/g, "ft ")
    .replace(/\bfort\s+/g, "ft ");
}

export function cityBaseName(name) {
  return stripTrailingRegion(String(name).replace(/\s*\([^)]*\)\s*$/u, "").trim());
}

export function distanceKilometers(first, second) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitude1 = toRadians(first[1]);
  const latitude2 = toRadians(second[1]);
  const latitudeDelta = latitude2 - latitude1;
  const longitudeDelta = toRadians(second[0] - first[0]);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function containsWholePlaceName(stationName, placeName) {
  const stationWords = normalizePlaceName(stationName).split(" ");
  const placeWords = normalizePlaceName(placeName).split(" ");

  return stationWords.some((_, startIndex) =>
    placeWords.every((word, offset) => stationWords[startIndex + offset] === word),
  );
}

function stripParentheticals(name) {
  return String(name).replace(/\s*[\(\[][^)\]]*[\)\]]/g, " ").replace(/\s+/g, " ").trim();
}

function stripTrailingRegion(name) {
  return name.replace(/,?\s+([A-Za-z]{2})$/u, (match, code) =>
    REGION_CODES.has(code.toUpperCase()) ? "" : match,
  ).trim();
}

function stripListedAffix(name, affixes, fromEnd) {
  let current = name;
  let changed = true;
  while (changed) {
    changed = false;
    const normalized = normalizePlaceName(current);
    for (const affix of affixes) {
      if (fromEnd) {
        if (!normalized.endsWith(` ${affix}`) && normalized !== affix) continue;
        if (normalized === affix) return "";
        current = current.slice(0, current.length - affix.length).trim().replace(/[,\-/]+$/g, "").trim();
      } else {
        if (!normalized.startsWith(`${affix} `) && normalized !== affix) continue;
        if (normalized === affix) return "";
        current = current.slice(affix.length).trim().replace(/^[\s,\-/]+/g, "").trim();
      }
      changed = true;
      break;
    }
  }
  return current;
}

const CITY_DESCRIPTOR_SEPARATOR = /\s+[–—-]\s+/;

function isSaintStyleName(name) {
  return /^(st\.?|saint|ste\.?)\s+/i.test(String(name).trim());
}

function lastNormalizedWord(name) {
  const words = normalizePlaceName(name).split(" ").filter(Boolean);
  return words.at(-1) ?? "";
}

function stripOperatorBrand(name) {
  const words = String(name).trim().split(/\s+/);
  if (words.length !== 2) return name;
  if (!OPERATOR_LAST_WORDS.has(normalizePlaceName(words[1]))) return name;
  return words[0];
}

function isAddressLike(name) {
  if (/^\d/.test(name) || name.includes("&") || name.includes("/")) return true;
  if (/\b(rt|rte|route|hwy|us-?|ih?|sr)\s*\d/i.test(name)) return true;
  if (/\b(at|and)\b/i.test(name) && STREET_WORD_PATTERN.test(name)) return true;
  return false;
}

function isAcronymLike(name) {
  return /^[A-Z]{2,4}$/.test(String(name).trim());
}

function isStreetOrVenueName(name) {
  if (!name) return false;
  const normalized = normalizePlaceName(name);
  if (VENUE_PHRASES.some((phrase) => normalized.includes(phrase))) return true;
  if (isAddressLike(name)) return true;
  if (/\bmall\b/i.test(normalized)) return true;
  const lastWord = lastNormalizedWord(name);
  if (STREET_LAST_WORDS.has(lastWord) && !isSaintStyleName(name)) return true;
  if (VENUE_LAST_WORDS.has(lastWord)) return true;
  return false;
}

function cityTokenBeforeDescriptor(name) {
  const separator = name.search(CITY_DESCRIPTOR_SEPARATOR);
  if (separator === -1) return name;
  return name.slice(0, separator).trim();
}

function isCityLike(name) {
  if (!name || isAddressLike(name) || isStreetOrVenueName(name)) return false;
  if (isAcronymLike(name)) return false;
  if (CITY_DESCRIPTOR_SEPARATOR.test(name)) return false;
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name)) return false;
  const normalized = normalizePlaceName(name);
  if (STATE_AND_PROVINCE_NAMES.has(normalized) || GENERIC_LABELS.has(normalized)) return false;
  if (LEFTOVER_FACILITY_WORDS.test(normalized)) return false;
  const letters = name.replace(/[^\p{L}\p{M}]/gu, "");
  if (letters.length < 3) return false;
  if (normalized.split(" ").length > 3) return false;
  return true;
}

function isTransitHubName(name) {
  return TRANSIT_HUB_PATTERN.test(name);
}

function cleanedStationText(name) {
  let text = stripParentheticals(name);
  text = stripTrailingRegion(text);
  text = cityTokenBeforeDescriptor(text);
  text = stripListedAffix(text, CITY_PREFIXES, false);
  return text.replace(/\s+/g, " ").trim();
}

export function candidateCityLabel(name) {
  let text = cleanedStationText(name);
  if (!text || isStreetOrVenueName(text)) return null;
  text = stripListedAffix(text, FACILITY_SUFFIXES, true);
  text = stripOperatorBrand(text);
  text = text.replace(/\s+[A-Z]{2,5}$/g, "").trim();
  text = text.replace(/\s+/g, " ").trim();
  if (!text || isStreetOrVenueName(text)) return null;
  return isCityLike(text) ? text : null;
}

export function isSearchableCityLabel(name) {
  if (COMPASS_QUALIFIER_PATTERN.test(String(name).trim())) return false;
  return Boolean(candidateCityLabel(cityBaseName(name) || name));
}

function inferredSourceCity(stop) {
  return stop.city?.trim() ? candidateCityLabel(stop.city) : null;
}

function leftoverAttachRadiusKm(stop) {
  return isTransitHubName(stop.name) ? CITY_CLUSTER_RADIUS_KM : GENERIC_ATTACH_RADIUS_KM;
}

function centroid(stops) {
  const sum = stops.reduce(
    (total, stop) => [total[0] + stop.coordinates[0], total[1] + stop.coordinates[1]],
    [0, 0],
  );
  return [sum[0] / stops.length, sum[1] / stops.length];
}

function clusterStops(stops, radiusKm) {
  const remaining = [...stops];
  const clusters = [];

  while (remaining.length > 0) {
    const clusterStopsForCity = [remaining.shift()];
    let grew = true;
    while (grew) {
      grew = false;
      for (let index = remaining.length - 1; index >= 0; index -= 1) {
        const candidate = remaining[index];
        if (
          clusterStopsForCity.some(
            (stop) => distanceKilometers(stop.coordinates, candidate.coordinates) <= radiusKm,
          )
        ) {
          clusterStopsForCity.push(candidate);
          remaining.splice(index, 1);
          grew = true;
        }
      }
    }
    clusters.push({
      stops: clusterStopsForCity,
      centroid: centroid(clusterStopsForCity),
    });
  }

  return clusters;
}

function uniqueCoordinateCount(stops) {
  return new Set(stops.map((stop) => stop.coordinates.join(","))).size;
}

function clusterWeight(cluster) {
  return uniqueCoordinateCount(cluster.stops);
}

function preferredBaseName(stops, fallback) {
  const counts = new Map();
  for (const stop of stops) {
    const label = inferredSourceCity(stop) || candidateCityLabel(stop.name);
    if (!label) continue;
    const key = normalizeCityKey(label);
    const current = counts.get(key);
    if (!current || label.length < current.name.length) {
      counts.set(key, { name: label, count: (current?.count ?? 0) + 1 });
    } else {
      current.count += 1;
    }
  }
  const ranked = [...counts.values()].sort(
    (first, second) => second.count - first.count || first.name.length - second.name.length,
  );
  return ranked[0]?.name ?? fallback;
}

function dropLikelyGeocodeOutliers(clusters) {
  if (clusters.length < 2) return clusters;
  const namesByCluster = clusters.map(
    (cluster) => new Set(cluster.stops.map((stop) => normalizePlaceName(stop.name))),
  );
  const states = clusters.map((cluster) => regionCode(cluster.centroid));
  const weights = clusters.map((cluster) => uniqueCoordinateCount(cluster.stops));
  const maxWeight = Math.max(...weights);

  return clusters.filter((cluster, index) => {
    if (weights[index] >= 2 || weights[index] === maxWeight) return true;
    return ![...namesByCluster[index]].some((name) =>
      clusters.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          weights[otherIndex] > weights[index] &&
          states[otherIndex] === states[index] &&
          namesByCluster[otherIndex].has(name),
      ),
    );
  });
}

function formatCityDisplayName(baseName, state) {
  return state ? `${baseName}, ${state}` : baseName;
}

function mergeNearbyClusters(clusters, radiusKm) {
  const remaining = clusters.map((cluster) => ({
    stops: [...cluster.stops],
    centroid: cluster.centroid,
  }));
  const merged = [];

  while (remaining.length > 0) {
    const current = remaining.shift();
    let grew = true;
    while (grew) {
      grew = false;
      for (let index = remaining.length - 1; index >= 0; index -= 1) {
        if (distanceKilometers(current.centroid, remaining[index].centroid) <= radiusKm) {
          current.stops.push(...remaining[index].stops);
          current.centroid = centroid(current.stops);
          remaining.splice(index, 1);
          grew = true;
        }
      }
    }
    merged.push(current);
  }

  return merged;
}

function dominantCluster(clusters) {
  return clusters.reduce((best, cluster) => {
    if (cluster.stops.length !== best.stops.length) {
      return cluster.stops.length > best.stops.length ? cluster : best;
    }
    const bestWeight = clusterWeight(best);
    const weight = clusterWeight(cluster);
    return weight > bestWeight ? cluster : best;
  });
}

function selectSearchableClusters(clusters) {
  const nearbyMerged = mergeNearbyClusters(clusters, CITY_CLUSTER_RADIUS_KM);
  const byState = new Map();
  const unlabeled = [];

  for (const cluster of nearbyMerged) {
    const state = regionCode(cluster.centroid);
    if (!state) {
      unlabeled.push(cluster);
      continue;
    }
    const list = byState.get(state) ?? [];
    list.push(cluster);
    byState.set(state, list);
  }

  const selected = [];
  const discarded = [];

  const keepPrimary = (list) => {
    if (list.length <= 1) {
      selected.push(...list);
      return;
    }
    const primary = dominantCluster(list);
    for (const cluster of list) {
      if (cluster === primary) selected.push(cluster);
      else discarded.push(cluster);
    }
  };

  for (const list of byState.values()) keepPrimary(list);
  keepPrimary(unlabeled);

  return { selected, discarded };
}

function displayNamesForClusters(baseName, clusters) {
  return clusters.map((cluster) => formatCityDisplayName(baseName, regionCode(cluster.centroid)));
}

function collectAnchorNames(stops) {
  const anchors = new Map();
  for (const stop of stops) {
    const label = inferredSourceCity(stop) || candidateCityLabel(stop.name);
    if (!label) continue;
    const key = normalizeCityKey(label);
    const current = anchors.get(key);
    if (!current || label.length < current.length) anchors.set(key, label);
  }
  return [...anchors.values()].sort(
    (first, second) =>
      second.split(" ").length - first.split(" ").length || second.length - first.length,
  );
}

function stopNameRefersToCity(stationName, cityName) {
  const text = cleanedStationText(stationName);
  if (!text || isStreetOrVenueName(text)) return false;

  const normalizedText = normalizePlaceName(text);
  const normalizedCity = normalizePlaceName(cityName);
  if (normalizedText !== normalizedCity && !normalizedText.startsWith(`${normalizedCity} `)) {
    return false;
  }

  const remainder = normalizedText.slice(normalizedCity.length).trim();
  if (!remainder) return true;

  const strippedRemainder = stripListedAffix(remainder, FACILITY_SUFFIXES, true)
    .replace(/^\d+\s*/, "")
    .trim();
  return !strippedRemainder;
}

function cityLabelForStop(stop, anchors) {
  const fromSourceCity = inferredSourceCity(stop);
  if (fromSourceCity) return fromSourceCity;
  const landmark = landmarkCityLabel(stop.name);
  if (landmark) return landmark;
  const contained = anchors.filter((anchor) => stopNameRefersToCity(stop.name, anchor));
  if (contained.length > 0) return contained[0];
  return candidateCityLabel(stop.name);
}

function placeFromStops(id, name, stops) {
  return {
    id,
    name,
    query: name,
    kind: "city",
    stopIds: [...new Set(stops.map((stop) => stop.id))],
    stationNames: [...new Set(stops.map((stop) => stop.name))].sort((first, second) =>
      first.localeCompare(second),
    ),
    agencies: [...new Set(stops.map((stop) => stop.agency))].sort(),
    coordinates: centroid(stops),
  };
}

function attachLeftovers(leftovers, cityClusters) {
  for (const stop of leftovers) {
    let nearest;
    let nearestDistance = leftoverAttachRadiusKm(stop);
    for (const cluster of cityClusters) {
      const distance = distanceKilometers(cluster.centroid, stop.coordinates);
      if (distance <= nearestDistance) {
        nearest = cluster;
        nearestDistance = distance;
      }
    }
    if (nearest) nearest.stops.push(stop);
  }
}

export function buildPlaces(stops) {
  const anchors = collectAnchorNames(stops);
  const labeled = [];
  const leftovers = [];

  for (const stop of stops) {
    const label = cityLabelForStop(stop, anchors);
    if (label) labeled.push({ stop, label, key: normalizeCityKey(label) });
    else leftovers.push(stop);
  }

  const byKey = new Map();
  for (const item of labeled) {
    const group = byKey.get(item.key) ?? { baseName: item.label, items: [] };
    if (item.label.length < group.baseName.length) group.baseName = item.label;
    group.items.push(item);
    byKey.set(item.key, group);
  }

  const cityClusters = [];
  const discardedStops = [];
  for (const group of byKey.values()) {
    const clusters = dropLikelyGeocodeOutliers(
      clusterStops(
        group.items.map((item) => item.stop),
        CITY_CLUSTER_RADIUS_KM,
      ),
    );
    const { selected, discarded } = selectSearchableClusters(clusters);
    const names = displayNamesForClusters(
      preferredBaseName(group.items.map((item) => item.stop), group.baseName),
      selected,
    );
    selected.forEach((cluster, index) => {
      cityClusters.push({
        name: names[index],
        stops: cluster.stops,
        centroid: cluster.centroid,
      });
    });
    for (const cluster of discarded) discardedStops.push(...cluster.stops);
  }

  attachLeftovers([...leftovers, ...discardedStops], cityClusters);

  return cityClusters
    .map((cluster, index) => placeFromStops(`c${index}`, cluster.name, cluster.stops))
    .sort(
      (first, second) => first.name.localeCompare(second.name) || first.id.localeCompare(second.id),
    )
    .map((place, index) => ({ ...place, id: `c${index}` }));
}
