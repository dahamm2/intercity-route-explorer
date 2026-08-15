# Intercivia

Intercivia is an interactive map of intercity bus service across about 72 operators. Search an origin city and a destination city to see directed routes, their ordered stops, and weekly frequency. When there is no direct trip, the explorer shows one-transfer options that change buses in a shared city.

## Public site

The intended public site is the GitHub Pages URL:

**https://dahamm2.github.io/intercity-route-explorer/**

## What you can do

- Search origin and destination by city. Each city includes all of its stations.
- See routes that serve the origin **before** the destination (direction follows the source stop order).
- Open a route to view ordered stops and grouped weekly departures.
- If no direct trip exists, review one-transfer connections via a shared city.
- Highlight a result on the map.

## Data notes

These limits are part of how the source data is interpreted, not bugs in the map:

- **Cities are inferred.** The source dataset has no city field. Searchable places are built from station names and coordinates (and any nearby stations that belong to the same inferred city). Distant places that share a name stay separate. These are evidence-based station groups, not official city boundaries.
- **Transfers are topology-only.** A one-transfer option means two directed route legs meet in the same city. Times are not coordinated, and weekly frequencies are for each leg, not a timed connection.

## Run it locally

You need [Node.js](https://nodejs.org/) (the project is developed with a current LTS release).

```bash
npm install
npm run dev
```

Then open the local address Vite prints in the terminal (usually `http://localhost:5173`).

`npm run dev` rebuilds `public/data/network.json` when the large source GeoJSON is present. If that file is missing, the existing `network.json` already in the repo is used, so a normal clone can still run.

Other useful commands:

- `npm test` — run the unit tests
- `npm run build` — build the static site into `dist/`

## What is in this repository

| Included | Not uploaded |
| --- | --- |
| Website source (`index.html`, `src/`, `scripts/`) | `intercity_GeoJSON_dataset.geojson` (about 245 MB / 13.5 million lines; too large for GitHub) |
| Published data: `public/data/network.json` (~5.6 MB) | `node_modules/` and `dist/` (generated locally or in CI) |
| GitHub Pages workflow and `DEPLOY.md` | |

The website only needs `network.json`. Keep the GeoJSON on your computer if you want to regenerate that file from the original source.

## Credits

Developed in the context of intercity GTFS research at the University of Illinois. Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
