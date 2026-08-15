import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import {
  createPlaceLookup,
  filterCitySuggestions,
  placeSuggestionLabel,
  resolvePlaceValue,
} from "./place-search";
import { formatRouteTooltipLabel } from "./map-tooltip";
import { coordinatesForSegment, findRoutesBetween } from "./route-search";
import { findTransferItineraries } from "./transfer-search";

const ROUTE_COLORS = ["#ef5b35", "#3273dc", "#139b79", "#8a5bd6", "#d78a14", "#d64f82"];
const PATH_STYLE = {
  idle: { weight: 5, opacity: 0.88 },
  selected: { weight: 10, opacity: 1 },
  dimmed: { weight: 2.4, opacity: 0.24 },
  hover: { weight: 7, opacity: 0.96 },
};
const HALO_STYLE = {
  hidden: { weight: 0, opacity: 0 },
  selected: { color: "#ffffff", weight: 16, opacity: 0.92 },
};
const NORTH_AMERICA_BOUNDS = [
  [24, -126],
  [51, -66],
];

const elements = {
  appStatus: document.querySelector("#app-status"),
  origin: document.querySelector("#origin"),
  destination: document.querySelector("#destination"),
  originHelp: document.querySelector("#origin-help"),
  destinationHelp: document.querySelector("#destination-help"),
  originSuggestions: document.querySelector("#origin-suggestions"),
  destinationSuggestions: document.querySelector("#destination-suggestions"),
  swap: document.querySelector("#swap"),
  reset: document.querySelector("#reset"),
  results: document.querySelector("#results"),
  resultSummary: document.querySelector("#result-summary"),
  resultsEyebrow: document.querySelector("#results-eyebrow"),
  loading: document.querySelector("#loading"),
  dataNote: document.querySelector("#data-note"),
  routeCount: document.querySelector("#route-count"),
  stopCount: document.querySelector("#stop-count"),
};

const map = L.map("map", {
  zoomControl: false,
  preferCanvas: true,
  minZoom: 3,
  maxZoom: 15,
  maxBoundsViscosity: 0.5,
});
L.control.zoom({ position: "bottomright" }).addTo(map);
L.control
  .scale({ position: "bottomleft", imperial: true, metric: false, maxWidth: 120 })
  .addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);
map.fitBounds(NORTH_AMERICA_BOUNDS, { padding: [12, 12] });
map.on("movestart zoomstart mouseout", hideRouteTooltip);

let network;
let placesByName;
let stopsById;
let origin;
let destination;
let baseRoutesLayer;
let selectionLayer = L.featureGroup().addTo(map);
const selectionRenderer = L.svg({ padding: 0.45 });
let routeLayers = new Map();
let activeRouteId;
let hoveredRouteId;
let routeTooltip;

function flattenRouteCoordinates(route) {
  return coordinatesForSegment(route, 0, route.stops.length - 1);
}

function announce(message) {
  elements.appStatus.textContent = message;
}

function setInputState(input, help, place, invalidMessage) {
  const hasValue = input.value.trim().length > 0;
  const invalid = hasValue && !place;
  input.setAttribute("aria-invalid", String(invalid));
  if (invalid) {
    help.textContent = invalidMessage;
  } else if (place) {
    const stationCount = place.stationNames?.length ?? place.stopIds.length;
    help.textContent = `Searching ${stationCount} station${stationCount === 1 ? "" : "s"} in ${place.name}.`;
  } else {
    help.textContent = "Choose a city from the list.";
  }
}

function resolvePlace(input) {
  return resolvePlaceValue(placesByName, input.value);
}

function markerIcon(kind, label) {
  return L.divIcon({
    className: "map-marker-wrap",
    html: `<span class="map-marker map-marker--${kind}" aria-hidden="true">${label}</span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 35],
    popupAnchor: [0, -32],
  });
}

function renderBaseRoutes() {
  const features = network.routes
    .map((route) => ({
      type: "Feature",
      properties: { id: route.id },
      geometry: { type: "LineString", coordinates: flattenRouteCoordinates(route) },
    }))
    .filter((feature) => feature.geometry.coordinates.length > 1);

  baseRoutesLayer = L.geoJSON(
    { type: "FeatureCollection", features },
    {
      renderer: L.canvas({ padding: 0.35 }),
      interactive: false,
      style: {
        color: "#546c84",
        weight: 1.1,
        opacity: 0.18,
      },
    },
  ).addTo(map);
}

function stopListItem(stop, index, finalIndex) {
  const positionClass =
    index === 0 ? "route-stop--origin" : index === finalIndex ? "route-stop--destination" : "";
  return `
    <li class="route-stop ${positionClass}">
      <span class="route-stop__dot" aria-hidden="true"></span>
      <span>${escapeHtml(stop.name)}</span>
    </li>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatFrequency(weeklyTrips) {
  const value = Number(weeklyTrips);
  return `${value.toLocaleString()} trip${value === 1 ? "" : "s"} / week`;
}

function routeCard(match, index, options = {}) {
  const { route, originIndex, destinationIndex } = match;
  const segmentStops = route.stops
    .slice(originIndex, destinationIndex + 1)
    .map((stopId) => stopsById.get(stopId))
    .filter(Boolean);
  const color = options.color ?? ROUTE_COLORS[index % ROUTE_COLORS.length];
  const focusId = options.focusId ?? route.id;
  const heading = options.heading ?? route.name;

  return `
    <article class="route-card" data-route-id="${focusId}" style="--route-color:${color}">
      <button class="route-card__focus" type="button" data-focus-route="${focusId}"
        aria-label="Focus ${escapeHtml(heading)} on map">
        <span>View on map</span>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7.5 4 6 6-6 6"/></svg>
      </button>
      <div class="route-card__meta">
        <span class="route-card__swatch" aria-hidden="true"></span>
        <span>${escapeHtml(options.meta ?? route.agency)}</span>
      </div>
      <h3>${escapeHtml(heading)}</h3>
      <div class="frequency">
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.7 1.6"/></svg>
        <strong>${formatFrequency(route.weeklyTrips)}</strong>
        <span>total grouped weekly departures</span>
      </div>
      ${
        route.sourceFeatureCount > 1
          ? `<p class="grouping-note">${route.sourceFeatureCount} source features combined for this operator and stop pattern</p>`
          : ""
      }
      <details>
        <summary>
          <span>${segmentStops.length} ordered stop${segmentStops.length === 1 ? "" : "s"}</span>
          <span class="summary-action">Show stops</span>
        </summary>
        <ol class="route-stops">
          ${segmentStops.map((stop, stopIndex) => stopListItem(stop, stopIndex, segmentStops.length - 1)).join("")}
        </ol>
      </details>
    </article>
  `;
}

function transferHubLabel(itinerary) {
  const arriving = stopsById.get(itinerary.firstLeg.hubStopId);
  const departing = stopsById.get(itinerary.secondLeg.hubStopId);
  if (itinerary.sameStop) {
    return `Transfer at ${arriving?.name ?? itinerary.hub.name}`;
  }
  if (arriving && departing) {
    return `Transfer in ${itinerary.hub.name} · ${arriving.name} to ${departing.name}`;
  }
  return `Transfer in ${itinerary.hub.name}`;
}

function transferCard(itinerary, index) {
  const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
  const itineraryId = `t${index}`;
  return `
    <article class="transfer-card" data-route-id="${itineraryId}" style="--route-color:${color}">
      <div class="transfer-card__hub">
        <strong>${escapeHtml(transferHubLabel(itinerary))}</strong>
        <span>One transfer · times are not coordinated</span>
      </div>
      ${routeCard(itinerary.firstLeg, index, {
        color,
        focusId: `${itineraryId}:first`,
        meta: `Leg 1 · ${itinerary.firstLeg.route.agency}`,
        heading: itinerary.firstLeg.route.name,
      })}
      ${routeCard(itinerary.secondLeg, index, {
        color,
        focusId: `${itineraryId}:second`,
        meta: `Leg 2 · ${itinerary.secondLeg.route.agency}`,
        heading: itinerary.secondLeg.route.name,
      })}
    </article>
  `;
}

function addPlaceMarkers(place, kind) {
  const seenCoordinates = new Set();
  for (const stopId of place.stopIds) {
    const stop = stopsById.get(stopId);
    if (!stop) continue;
    const coordinateKey = stop.coordinates.join(",");
    if (seenCoordinates.has(coordinateKey)) continue;
    seenCoordinates.add(coordinateKey);
    L.marker([stop.coordinates[1], stop.coordinates[0]], {
      icon: markerIcon(kind, kind === "origin" ? "A" : "B"),
      keyboard: true,
      title: stop.name,
    })
      .bindPopup(`<strong>${escapeHtml(stop.name)}</strong><br>${escapeHtml(stop.agency)}`)
      .addTo(selectionLayer);
  }
}

function ensureRouteTooltip() {
  if (routeTooltip) return routeTooltip;
  routeTooltip = L.DomUtil.create("div", "route-hover-tooltip", map.getContainer());
  routeTooltip.hidden = true;
  routeTooltip.setAttribute("role", "tooltip");
  return routeTooltip;
}

function hideRouteTooltip() {
  if (routeTooltip) routeTooltip.hidden = true;
}

function moveRouteTooltip(leafletEvent) {
  const el = ensureRouteTooltip();
  const point = leafletEvent.containerPoint;
  if (!point) return;
  const gap = 16;
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  const container = map.getContainer();
  const flip = container.clientWidth - point.x < width + gap + 8;
  el.classList.toggle("route-hover-tooltip--flip", flip);
  const left = flip ? point.x - width - gap : point.x + gap;
  const top = Math.min(
    Math.max(point.y, height / 2 + 8),
    container.clientHeight - height / 2 - 8,
  );
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function showRouteTooltip(label, leafletEvent) {
  const el = ensureRouteTooltip();
  el.textContent = label;
  el.hidden = false;
  moveRouteTooltip(leafletEvent);
}

function bringStopMarkersToFront() {
  selectionLayer.eachLayer((layer) => {
    if (layer instanceof L.Marker) layer.bringToFront();
  });
}

function applyRouteEmphasis({ raiseSelected = false } = {}) {
  let selectedEntry;
  for (const [id, entry] of routeLayers) {
    const selected = id === activeRouteId;
    const hovered = id === hoveredRouteId && !selected;
    entry.line.setStyle(
      selected
        ? PATH_STYLE.selected
        : hovered
          ? PATH_STYLE.hover
          : activeRouteId
            ? PATH_STYLE.dimmed
            : PATH_STYLE.idle,
    );
    entry.halo.setStyle(selected ? HALO_STYLE.selected : HALO_STYLE.hidden);
    if (selected) selectedEntry = entry;
  }
  if (raiseSelected && selectedEntry) {
    selectedEntry.halo.bringToFront();
    selectedEntry.line.bringToFront();
    bringStopMarkersToFront();
  }
}

function drawSegment(match, index, layerId, options = {}) {
  const coordinates = coordinatesForSegment(match.route, match.originIndex, match.destinationIndex);
  if (coordinates.length < 2) return null;
  const latlngs = coordinates.map(([longitude, latitude]) => [latitude, longitude]);
  const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
  const tooltipLabel = formatRouteTooltipLabel(match.route.agency, match.route.name);

  const halo = L.polyline(latlngs, {
    color: HALO_STYLE.selected.color,
    weight: HALO_STYLE.hidden.weight,
    opacity: HALO_STYLE.hidden.opacity,
    interactive: false,
    renderer: selectionRenderer,
  }).addTo(selectionLayer);

  const layer = L.polyline(latlngs, {
    color,
    weight: PATH_STYLE.idle.weight,
    opacity: PATH_STYLE.idle.opacity,
    dashArray: options.dashed ? "8 7" : null,
    className: "route-path",
    renderer: selectionRenderer,
    bubblingMouseEvents: false,
  }).addTo(selectionLayer);

  layer.on("mouseover", (event) => {
    hoveredRouteId = layerId;
    applyRouteEmphasis();
    showRouteTooltip(tooltipLabel, event);
  });
  layer.on("mousemove", (event) => {
    moveRouteTooltip(event);
  });
  layer.on("mouseout", () => {
    if (hoveredRouteId === layerId) hoveredRouteId = undefined;
    applyRouteEmphasis();
    hideRouteTooltip();
  });
  layer.on("click", () => focusRoute(layerId));

  routeLayers.set(layerId, { line: layer, halo });
  return layer;
}

function addHubMarker(itinerary) {
  const arriving = stopsById.get(itinerary.firstLeg.hubStopId);
  const departing = stopsById.get(itinerary.secondLeg.hubStopId);
  const stop = arriving ?? departing;
  if (!stop) return;
  L.marker([stop.coordinates[1], stop.coordinates[0]], {
    icon: markerIcon("hub", "T"),
    keyboard: true,
    title: itinerary.hub.name,
  })
    .bindPopup(`<strong>${escapeHtml(transferHubLabel(itinerary))}</strong>`)
    .addTo(selectionLayer);
}

function focusRoute(routeId, announceFocus = true) {
  const entry = routeLayers.get(routeId);
  if (!entry) return;

  activeRouteId = routeId;
  hideRouteTooltip();
  applyRouteEmphasis({ raiseSelected: true });
  map.fitBounds(entry.line.getBounds(), { padding: [48, 48], maxZoom: 10 });

  document.querySelectorAll(".route-card, .transfer-card").forEach((card) => {
    const cardId = card.dataset.routeId;
    card.classList.toggle(
      card.classList.contains("transfer-card") ? "transfer-card--active" : "route-card--active",
      cardId === routeId || routeId.startsWith(`${cardId}:`),
    );
  });
  if (announceFocus) {
    const route = network.routes.find((candidate) => candidate.id === routeId);
    announce(`${route?.name ?? "Selected itinerary"} focused on the map.`);
  }
}

function renderSelection() {
  selectionLayer.clearLayers();
  routeLayers = new Map();
  activeRouteId = undefined;
  hoveredRouteId = undefined;
  hideRouteTooltip();
  document.body.classList.toggle("has-selection", Boolean(origin && destination));

  if (!origin || !destination) {
    elements.resultsEyebrow.textContent = "Plan a trip";
    elements.resultSummary.textContent = "Select two cities to see directed intercity service.";
    elements.results.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><path d="M7 25V8.5A2.5 2.5 0 0 1 9.5 6h13A2.5 2.5 0 0 1 25 8.5V25"/><path d="M5 25h22M11 11h10M11 16h4M20 16h1"/></svg>
        </div>
        <h3>Your routes will appear here</h3>
        <p>Direction matters: the origin must come before the destination in the route's ordered stops.</p>
      </div>`;
    if (baseRoutesLayer) baseRoutesLayer.setStyle({ opacity: 0.18 });
    map.fitBounds(NORTH_AMERICA_BOUNDS, { padding: [12, 12] });
    return;
  }

  if (origin.id === destination.id) {
    elements.resultsEyebrow.textContent = "Choose two places";
    elements.resultSummary.textContent = "Origin and destination must be different.";
    elements.results.innerHTML = `
      <div class="empty-state empty-state--compact">
        <h3>Same location selected</h3>
        <p>Choose a different destination to search for directed service.</p>
      </div>`;
    announce("Origin and destination must be different.");
    return;
  }

  const matches = findRoutesBetween(network.routes, origin, destination);
  const transfers = matches.length
    ? []
    : findTransferItineraries(network.routes, origin, destination, network.places, { stopsById });
  elements.resultsEyebrow.textContent = `${origin.name} → ${destination.name}`;
  elements.resultSummary.textContent = matches.length
    ? `${matches.length} directed service pattern${matches.length === 1 ? "" : "s"} found`
    : transfers.length
      ? `${transfers.length} one-transfer itinerar${transfers.length === 1 ? "y" : "ies"} found`
      : "No direct or one-transfer service in this direction";
  elements.results.innerHTML = matches.length
    ? matches.map((match, index) => routeCard(match, index)).join("")
    : transfers.length
      ? `<p class="transfer-intro">No direct trip. These options change buses once in a shared city. Weekly frequencies are for each leg; times are not coordinated.</p>${transfers.map(transferCard).join("")}`
      : `
      <div class="empty-state empty-state--compact">
        <h3>No directed service found</h3>
        <p>No direct trip or one-transfer connection was found. A route only qualifies when it serves the origin before the destination.</p>
      </div>`;

  if (baseRoutesLayer) baseRoutesLayer.setStyle({ opacity: 0.06 });
  addPlaceMarkers(origin, "origin");
  addPlaceMarkers(destination, "destination");

  const selectionBounds = L.latLngBounds();
  matches.forEach((match, index) => {
    const layer = drawSegment(match, index, match.route.id);
    if (layer) selectionBounds.extend(layer.getBounds());
  });
  transfers.forEach((itinerary, index) => {
    const firstLayer = drawSegment(itinerary.firstLeg, index, `t${index}:first`);
    const secondLayer = drawSegment(itinerary.secondLeg, index, `t${index}:second`, {
      dashed: true,
    });
    addHubMarker(itinerary);
    if (firstLayer) selectionBounds.extend(firstLayer.getBounds());
    if (secondLayer) selectionBounds.extend(secondLayer.getBounds());
  });

  selectionLayer.eachLayer((layer) => {
    if (layer instanceof L.Marker) selectionBounds.extend(layer.getLatLng());
  });
  if (selectionBounds.isValid()) map.fitBounds(selectionBounds, { padding: [44, 44], maxZoom: 9 });

  document.querySelectorAll("[data-focus-route]").forEach((button) => {
    button.addEventListener("click", () => focusRoute(button.dataset.focusRoute));
  });
  document.querySelectorAll(".route-card[data-route-id]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("details, button")) return;
      focusRoute(card.dataset.routeId);
    });
  });
  announce(
    matches.length
      ? `${matches.length} directed service patterns found from ${origin.name} to ${destination.name}.`
      : transfers.length
        ? `${transfers.length} one-transfer itineraries found from ${origin.name} to ${destination.name}.`
        : `No directed service patterns found from ${origin.name} to ${destination.name}.`,
  );
}

function updatePlace(which) {
  const isOrigin = which === "origin";
  const input = isOrigin ? elements.origin : elements.destination;
  const help = isOrigin ? elements.originHelp : elements.destinationHelp;
  const place = resolvePlace(input);
  if (place) input.value = place.query ?? place.name;
  if (isOrigin) origin = place;
  else destination = place;
  setInputState(input, help, place, "Choose a city from the location list.");
  renderSelection();
}

function hideSuggestions(list, input) {
  list.hidden = true;
  list.innerHTML = "";
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
}

function suggestionOptionId(list, index) {
  return `${list.id}-option-${index}`;
}

function renderSuggestions(which, query) {
  const isOrigin = which === "origin";
  const input = isOrigin ? elements.origin : elements.destination;
  const list = isOrigin ? elements.originSuggestions : elements.destinationSuggestions;
  const matches = filterCitySuggestions(network.places, query);

  if (!query.trim() || matches.length === 0) {
    hideSuggestions(list, input);
    return;
  }

  list.hidden = false;
  input.setAttribute("aria-expanded", "true");
  list.innerHTML = matches
    .map(
      (place, index) => `
        <li role="presentation">
          <button
            type="button"
            class="city-suggestions__option"
            role="option"
            id="${suggestionOptionId(list, index)}"
            data-place-name="${escapeHtml(place.query ?? place.name)}"
            aria-selected="false"
          >
            <span class="city-suggestions__name">${escapeHtml(place.name)}</span>
            <span class="city-suggestions__meta">${escapeHtml(placeSuggestionLabel(place))}</span>
          </button>
        </li>`,
    )
    .join("");
}

function activeSuggestionButton(list) {
  return list.querySelector(".city-suggestions__option--active");
}

function moveSuggestion(list, input, offset) {
  const options = [...list.querySelectorAll(".city-suggestions__option")];
  if (options.length === 0) return;
  const current = options.findIndex((option) => option.classList.contains("city-suggestions__option--active"));
  const nextIndex = current === -1 ? (offset > 0 ? 0 : options.length - 1) : (current + offset + options.length) % options.length;
  options.forEach((option, index) => {
    const active = index === nextIndex;
    option.classList.toggle("city-suggestions__option--active", active);
    option.setAttribute("aria-selected", String(active));
  });
  input.setAttribute("aria-activedescendant", options[nextIndex].id);
  options[nextIndex].scrollIntoView({ block: "nearest" });
}

function selectSuggestion(which, placeName) {
  const isOrigin = which === "origin";
  const input = isOrigin ? elements.origin : elements.destination;
  const list = isOrigin ? elements.originSuggestions : elements.destinationSuggestions;
  input.value = placeName;
  hideSuggestions(list, input);
  updatePlace(which);
}

function bindCityField(which) {
  const isOrigin = which === "origin";
  const input = isOrigin ? elements.origin : elements.destination;
  const help = isOrigin ? elements.originHelp : elements.destinationHelp;
  const list = isOrigin ? elements.originSuggestions : elements.destinationSuggestions;

  input.addEventListener("input", () => {
    const place = resolvePlace(input);
    if (isOrigin) origin = place;
    else destination = place;
    setInputState(input, help, place, "Keep typing, then choose a city.");
    renderSuggestions(which, input.value);
    renderSelection();
  });
  input.addEventListener("focus", () => {
    if (input.value.trim()) renderSuggestions(which, input.value);
  });
  input.addEventListener("keydown", (event) => {
    const open = !list.hidden;
    if (event.key === "ArrowDown" && (open || input.value.trim())) {
      event.preventDefault();
      if (list.hidden) renderSuggestions(which, input.value);
      moveSuggestion(list, input, 1);
      return;
    }
    if (event.key === "ArrowUp" && open) {
      event.preventDefault();
      moveSuggestion(list, input, -1);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      hideSuggestions(list, input);
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    const active = activeSuggestionButton(list);
    if (active) {
      selectSuggestion(which, active.dataset.placeName);
      return;
    }
    hideSuggestions(list, input);
    updatePlace(which);
  });
  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      hideSuggestions(list, input);
      updatePlace(which);
    }, 120);
  });
  list.addEventListener("mousedown", (event) => {
    const option = event.target.closest("[data-place-name]");
    if (!option) return;
    event.preventDefault();
    selectSuggestion(which, option.dataset.placeName);
  });
}

function bindEvents() {
  bindCityField("origin");
  bindCityField("destination");
  elements.swap.addEventListener("click", () => {
    const previousOrigin = elements.origin.value;
    elements.origin.value = elements.destination.value;
    elements.destination.value = previousOrigin;
    origin = resolvePlace(elements.origin);
    destination = resolvePlace(elements.destination);
    setInputState(elements.origin, elements.originHelp, origin, "Choose a city.");
    setInputState(
      elements.destination,
      elements.destinationHelp,
      destination,
      "Choose a city.",
    );
    hideSuggestions(elements.originSuggestions, elements.origin);
    hideSuggestions(elements.destinationSuggestions, elements.destination);
    renderSelection();
    announce("Origin and destination swapped.");
  });
  elements.reset.addEventListener("click", () => {
    elements.origin.value = "";
    elements.destination.value = "";
    origin = undefined;
    destination = undefined;
    hideSuggestions(elements.originSuggestions, elements.origin);
    hideSuggestions(elements.destinationSuggestions, elements.destination);
    setInputState(elements.origin, elements.originHelp, origin, "");
    setInputState(elements.destination, elements.destinationHelp, destination, "");
    renderSelection();
    elements.origin.focus();
    announce("Trip search cleared.");
  });
}

async function initialize() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/network.json`);

    if (!response.ok) throw new Error(`Data request failed with status ${response.status}`);
    network = await response.json();
    placesByName = createPlaceLookup(network.places);
    stopsById = new Map(network.stops.map((stop) => [stop.id, stop]));

    renderBaseRoutes();
    bindEvents();
    renderSelection();
    elements.routeCount.textContent = network.routes.length.toLocaleString();
    elements.stopCount.textContent = network.stops.length.toLocaleString();
    elements.dataNote.textContent =
      "The source has no city field. Search lists each inferred city once as city and state, and includes all of its stations. Distant places that share a name stay separate. If there is no direct trip, one-transfer options via a shared city are shown; those times are not coordinated.";
    elements.loading.hidden = true;
    document.querySelector("#planner").removeAttribute("aria-busy");
    announce(
      `Route explorer ready with ${network.routes.length.toLocaleString()} routes and ${network.places.length.toLocaleString()} searchable locations.`,
    );
  } catch (error) {
    console.error(error);
    elements.loading.innerHTML = `
      <div class="load-error">
        <strong>We couldn't load the route network.</strong>
        <span>Run <code>npm run prepare-data</code>, then refresh this page.</span>
      </div>`;
    announce("The route network could not be loaded.");
  }
}

initialize();
