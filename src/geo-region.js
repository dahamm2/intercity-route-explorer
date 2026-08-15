const REGIONS = [
  { code: "DC", lat: 38.897, lon: -77.027, minLat: 38.791, maxLat: 38.996, minLon: -77.12, maxLon: -76.909 },
  { code: "RI", lat: 41.681, lon: -71.512, minLat: 41.146, maxLat: 42.019, minLon: -71.907, maxLon: -71.121 },
  { code: "DE", lat: 39.319, lon: -75.507, minLat: 38.451, maxLat: 39.839, minLon: -75.789, maxLon: -75.049 },
  { code: "CT", lat: 41.598, lon: -72.755, minLat: 40.951, maxLat: 42.05, minLon: -73.728, maxLon: -71.787 },
  { code: "NJ", lat: 40.299, lon: -74.521, minLat: 38.929, maxLat: 41.357, minLon: -75.56, maxLon: -73.894 },
  { code: "MA", lat: 42.23, lon: -71.53, minLat: 41.187, maxLat: 42.887, minLon: -73.508, maxLon: -69.928 },
  { code: "NH", lat: 43.452, lon: -71.564, minLat: 42.697, maxLat: 45.305, minLon: -72.557, maxLon: -70.575 },
  { code: "VT", lat: 44.046, lon: -72.711, minLat: 42.727, maxLat: 45.017, minLon: -73.438, maxLon: -71.465 },
  { code: "MD", lat: 39.45, lon: -78.7, minLat: 39.2, maxLat: 39.723, minLon: -79.487, maxLon: -77.45 },
  { code: "MD", lat: 39.2, lon: -76.7, minLat: 38.93, maxLat: 39.53, minLon: -77.45, maxLon: -76.4 },
  { code: "MD", lat: 38.4, lon: -76.3, minLat: 37.912, maxLat: 39.07, minLon: -77.03, maxLon: -75.049 },
  { code: "WV", lat: 38.491, lon: -80.954, minLat: 37.202, maxLat: 40.639, minLon: -82.644, maxLon: -77.719 },
  { code: "VA", lat: 37.769, lon: -78.17, minLat: 36.541, maxLat: 39.466, minLon: -83.675, maxLon: -75.166 },
  { code: "SC", lat: 33.857, lon: -80.945, minLat: 32.045, maxLat: 35.216, minLon: -83.354, maxLon: -78.499 },
  { code: "NC", lat: 35.63, lon: -79.806, minLat: 33.752, maxLat: 36.588, minLon: -84.322, maxLon: -75.46 },
  { code: "PA", lat: 40.591, lon: -77.21, minLat: 39.72, maxLat: 42.27, minLon: -80.52, maxLon: -74.69 },
  { code: "NY", lat: 42.166, lon: -74.948, minLat: 40.477, maxLat: 45.016, minLon: -79.763, maxLon: -71.856 },
  { code: "ME", lat: 44.694, lon: -69.382, minLat: 43.06, maxLat: 47.46, minLon: -71.084, maxLon: -66.95 },
  { code: "OH", lat: 40.389, lon: -82.765, minLat: 38.403, maxLat: 41.977, minLon: -84.82, maxLon: -80.519 },
  { code: "IN", lat: 39.849, lon: -86.258, minLat: 37.772, maxLat: 41.761, minLon: -88.098, maxLon: -84.785 },
  { code: "KY", lat: 37.668, lon: -84.67, minLat: 36.497, maxLat: 39.147, minLon: -89.571, maxLon: -81.965 },
  { code: "TN", lat: 35.748, lon: -86.692, minLat: 34.983, maxLat: 36.678, minLon: -90.311, maxLon: -81.647 },
  { code: "AL", lat: 32.807, lon: -86.791, minLat: 30.146, maxLat: 35.008, minLon: -88.473, maxLon: -84.889 },
  { code: "GA", lat: 33.041, lon: -83.643, minLat: 30.356, maxLat: 35.001, minLon: -85.605, maxLon: -80.84 },
  { code: "FL", lat: 27.766, lon: -81.687, minLat: 24.396, maxLat: 31.001, minLon: -87.635, maxLon: -79.974 },
  { code: "MI", lat: 43.327, lon: -84.536, minLat: 41.696, maxLat: 48.306, minLon: -90.418, maxLon: -82.122 },
  { code: "WI", lat: 44.269, lon: -89.617, minLat: 42.492, maxLat: 47.31, minLon: -92.889, maxLon: -86.25 },
  { code: "IL", lat: 40.349, lon: -88.986, minLat: 36.97, maxLat: 42.508, minLon: -91.513, maxLon: -87.02 },
  { code: "MO", lat: 38.456, lon: -92.288, minLat: 35.995, maxLat: 40.614, minLon: -95.774, maxLon: -89.099 },
  { code: "AR", lat: 34.97, lon: -92.373, minLat: 33.004, maxLat: 36.5, minLon: -94.618, maxLon: -89.645 },
  { code: "MS", lat: 32.742, lon: -89.679, minLat: 30.174, maxLat: 34.996, minLon: -91.655, maxLon: -88.098 },
  { code: "LA", lat: 31.17, lon: -91.868, minLat: 28.855, maxLat: 33.02, minLon: -94.043, maxLon: -88.758 },
  { code: "IA", lat: 42.012, lon: -93.211, minLat: 40.375, maxLat: 43.501, minLon: -96.639, maxLon: -90.14 },
  { code: "MN", lat: 45.694, lon: -93.9, minLat: 43.499, maxLat: 49.384, minLon: -97.239, maxLon: -89.492 },
  { code: "KS", lat: 38.527, lon: -96.726, minLat: 36.993, maxLat: 40.003, minLon: -102.052, maxLon: -94.589 },
  { code: "NE", lat: 41.125, lon: -98.268, minLat: 39.999, maxLat: 43.002, minLon: -104.053, maxLon: -95.308 },
  { code: "OK", lat: 35.565, lon: -96.929, minLat: 33.616, maxLat: 37.002, minLon: -103.003, maxLon: -94.431 },
  { code: "TX", lat: 31.054, lon: -97.563, minLat: 25.837, maxLat: 36.501, minLon: -106.646, maxLon: -93.508 },
  { code: "SD", lat: 44.3, lon: -99.439, minLat: 42.48, maxLat: 45.945, minLon: -104.058, maxLon: -96.436 },
  { code: "ND", lat: 47.529, lon: -99.784, minLat: 45.935, maxLat: 49.0, minLon: -104.049, maxLon: -96.555 },
  { code: "CO", lat: 39.06, lon: -105.311, minLat: 36.993, maxLat: 41.003, minLon: -109.06, maxLon: -102.042 },
  { code: "NM", lat: 34.841, lon: -106.249, minLat: 31.332, maxLat: 37.0, minLon: -109.05, maxLon: -103.002 },
  { code: "WY", lat: 42.756, lon: -107.303, minLat: 40.995, maxLat: 45.006, minLon: -111.057, maxLon: -104.052 },
  { code: "MT", lat: 46.922, lon: -110.454, minLat: 44.358, maxLat: 49.001, minLon: -116.05, maxLon: -104.04 },
  { code: "UT", lat: 40.15, lon: -111.862, minLat: 36.998, maxLat: 42.001, minLon: -114.053, maxLon: -109.041 },
  { code: "AZ", lat: 33.73, lon: -111.431, minLat: 31.332, maxLat: 37.004, minLon: -114.817, maxLon: -109.045 },
  { code: "ID", lat: 44.24, lon: -114.479, minLat: 41.988, maxLat: 49.001, minLon: -117.243, maxLon: -111.044 },
  { code: "NV", lat: 38.314, lon: -117.055, minLat: 35.002, maxLat: 42.002, minLon: -120.006, maxLon: -114.04 },
  { code: "CA", lat: 36.116, lon: -119.682, minLat: 32.512, maxLat: 42.009, minLon: -124.482, maxLon: -114.131 },
  { code: "OR", lat: 44.572, lon: -122.071, minLat: 41.992, maxLat: 46.293, minLon: -124.703, maxLon: -116.463 },
  { code: "WA", lat: 47.401, lon: -121.491, minLat: 45.544, maxLat: 49.002, minLon: -124.849, maxLon: -116.916 },
  { code: "AK", lat: 61.371, lon: -152.404, minLat: 51.214, maxLat: 71.441, minLon: -179.15, maxLon: -129.98 },
  { code: "HI", lat: 21.094, lon: -157.498, minLat: 18.865, maxLat: 22.293, minLon: -160.25, maxLon: -154.807 },
  { code: "ON", lat: 50.0, lon: -85.0, minLat: 41.676, maxLat: 56.9, minLon: -95.16, maxLon: -74.32 },
  { code: "QC", lat: 52.94, lon: -73.549, minLat: 44.99, maxLat: 62.59, minLon: -79.77, maxLon: -57.1 },
  { code: "BC", lat: 53.727, lon: -127.648, minLat: 48.3, maxLat: 60.0, minLon: -139.06, maxLon: -114.03 },
  { code: "AB", lat: 53.933, lon: -116.576, minLat: 49.0, maxLat: 60.0, minLon: -120.0, maxLon: -110.0 },
  { code: "MB", lat: 53.761, lon: -98.814, minLat: 49.0, maxLat: 60.0, minLon: -102.0, maxLon: -88.9 },
  { code: "SK", lat: 52.94, lon: -106.451, minLat: 49.0, maxLat: 60.0, minLon: -110.0, maxLon: -101.36 },
  { code: "NS", lat: 45.0, lon: -63.0, minLat: 43.37, maxLat: 47.03, minLon: -66.4, maxLon: -59.68 },
  { code: "NB", lat: 46.565, lon: -66.462, minLat: 44.56, maxLat: 48.07, minLon: -69.06, maxLon: -63.76 },
  { code: "NL", lat: 53.136, lon: -57.66, minLat: 46.56, maxLat: 60.37, minLon: -67.82, maxLon: -52.62 },
  { code: "PE", lat: 46.511, lon: -63.417, minLat: 45.95, maxLat: 47.06, minLon: -64.42, maxLon: -61.97 },
];

function squaredDistance(lat, lon, region) {
  return (lat - region.lat) ** 2 + (lon - region.lon) ** 2;
}

export function regionCode(coordinates) {
  if (!coordinates || coordinates.length < 2) return null;
  const [longitude, latitude] = coordinates;
  const containing = REGIONS.filter(
    (region) =>
      latitude >= region.minLat &&
      latitude <= region.maxLat &&
      longitude >= region.minLon &&
      longitude <= region.maxLon,
  );
  const pool = containing.length > 0 ? containing : REGIONS;
  let best = pool[0];
  let bestDistance = Infinity;
  for (const region of pool) {
    const distance = squaredDistance(latitude, longitude, region);
    if (distance < bestDistance) {
      best = region;
      bestDistance = distance;
    }
  }
  if (containing.length === 0 && bestDistance > 36) return null;
  return best?.code ?? null;
}

export function cardinalOffset(from, to) {
  const longitudeDelta = to[0] - from[0];
  const latitudeDelta = to[1] - from[1];
  if (Math.abs(longitudeDelta) > Math.abs(latitudeDelta)) {
    return longitudeDelta >= 0 ? "east" : "west";
  }
  return latitudeDelta >= 0 ? "north" : "south";
}
