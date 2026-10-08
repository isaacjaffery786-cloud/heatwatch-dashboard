# HEATWATCH — Heatwave Monitoring & Early Warning Dashboard

A college mini-project dashboard built on a real 50,000-row environmental
dataset (**Heatwave_Monitoring_Dataset_50000.xlsx**).

## Dataset facts (verified by `scripts/preprocess.mjs`)

| Fact | Value |
| --- | --- |
| Records | 50,000 |
| Date range | 2016-07-15 → 2026-07-15 |
| Cities / States | 10 / 8 |
| Heatwave records | 31,355 (62.71%) |
| Severity | Moderate 9,429 · Severe 12,395 · Extreme 9,531 |

## Stack

- **Next.js 15 (App Router) + TypeScript**
- **Tailwind CSS v4**
- **Recharts** (trends, donut, ranking, scatter, factor charts)
- **react-leaflet + Leaflet** (city-level map)
- **Lucide React** icons
- **xlsx** (Excel preprocessing only — never in the browser)

## Data architecture

The Excel workbook is parsed **once**, at preprocessing time, not on every
render:

```
dataset/Heatwave_Monitoring_Dataset_50000.xlsx   (source of truth)
        │  node scripts/preprocess.mjs   (uses xlsx, one-time)
        ▼
public/data/heatwatch.json               (4.7 MB, positional row arrays +
                                          string dictionaries for City/State/
                                          Country/Severity)
        │  fetch() once, cached promise   (src/lib/dataLoader.ts)
        ▼
useMemo filtering + single-pass aggregations (src/lib/analytics.ts)
```

- All 20 dataset columns are preserved (no columns dropped).
- Filtering/aggregation are single passes over row arrays with `useMemo`
  — never recomputed on unrelated re-renders.
- Charts aggregate before rendering; the scatter chart uses an evenly-strided
  sample (max 800 points) and the table paginates at 25 rows/page, so the DOM
  never holds 50,000 elements.
- The Leaflet map renders **one marker per city** (aggregated), not per record.

## Getting started

```bash
npm install
npm run preprocess   # regenerate public/data/heatwatch.json from the Excel file
npm run build        # production build
npm start            # serve on http://localhost:3000
# or for development:
npm run dev
```

`npm run preprocess` auto-detects the dataset in `dataset/`, or accepts a path:
`npm run preprocess -- path/to/file.xlsx`

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run preprocess` | Excel → compact JSON (one-time) |
| `node scripts/probe.mjs` | Inspect raw Excel headers/types |
| `node scripts/verify.mjs` | Print dataset facts derived from the JSON |

## Dashboard sections

1. **Header** — HEATWATCH branding + "Live Dataset Monitoring" status
2. **Filter bar** — date range, state, city, heatwave status, severity
   (drives every component)
3. **KPI cards** — total records, heatwave events, rate, cities, avg max
   temp, highest heat index (all computed from filtered rows)
4. **Heatwave trend** — area + rate line, day/month/year granularity
5. **Temperature trend** — avg max vs avg temp, day/month/year
6. **Severity distribution** — donut (Moderate/Severe/Extreme)
7. **City risk ranking** — horizontal bars, switchable metric
8. **Temperature vs heat index** — scatter with heatwave/normal split
9. **Weather factors** — small-multiple bars (humidity, wind, rainfall,
   solar radiation, cloud cover)
10. **Geographical monitoring** — Leaflet map, one aggregated marker per city
11. **Heatwave Alert Center** — top-risk cities from filtered data
12. **Data table** — search + sort + pagination (25 rows/page)
13. **Automated insights** — derived from filtered rows only
