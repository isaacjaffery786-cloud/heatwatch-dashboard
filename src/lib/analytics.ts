import {
  IDX,
  type Dataset,
  type Row,
  type Severity,
  isHeatwave,
  num,
} from "./dataset";

// re-export core dataset types so components can import them from one place
export type { Dataset, Row, Severity } from "./dataset";

export interface Filters {
  from: string | null; // "YYYY-MM-DD" or null = unbounded
  to: string | null;
  city: string; // "all" | city name
  state: string; // "all" | state name
  status: "all" | "heatwave" | "normal";
  severity: "all" | Severity;
}

export const DEFAULT_FILTERS: Filters = {
  from: "2016-07-15",
  to: "2026-07-15",
  city: "all",
  state: "all",
  status: "all",
  severity: "all",
};

/** Single pass over the (up to) 50,000 rows applying every active filter. */
export function filterRows(ds: Dataset, f: Filters): Row[] {
  const from = f.from ?? "";
  const to = f.to ?? "";
  const cityIdx = f.city === "all" ? -1 : ds.dictionaries.City.indexOf(f.city);
  const stateIdx =
    f.state === "all" ? -1 : ds.dictionaries.State.indexOf(f.state);
  const sevIdx =
    f.severity === "all"
      ? -1
      : ds.dictionaries.Heatwave_Severity.indexOf(f.severity);

  return ds.rows.filter((row) => {
    const date = row[IDX.Date] as string;
    if (from && date < from) return false;
    if (to && date > to) return false;
    if (cityIdx >= 0 && row[IDX.City] !== cityIdx) return false;
    if (stateIdx >= 0 && row[IDX.State] !== stateIdx) return false;
    const hw = isHeatwave(row);
    if (f.status === "heatwave" && !hw) return false;
    if (f.status === "normal" && hw) return false;
    if (sevIdx >= 0) {
      if (!hw || row[IDX.Heatwave_Severity] !== sevIdx) return false;
    }
    return true;
  });
}

/* ------------------------------- KPIs ------------------------------------ */

export interface Kpis {
  total: number;
  heatwaveEvents: number;
  heatwaveRate: number; // percent
  cities: number;
  avgMaxTemp: number; // °C
  maxHeatIndex: number; // °C
}

export function computeKpis(rows: Row[]): Kpis {
  const citySet = new Set<number>();
  let heatwave = 0;
  let maxTempSum = 0;
  let maxTempCount = 0;
  let maxHeatIndex = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    citySet.add(row[IDX.City] as number);
    if (isHeatwave(row)) heatwave += 1;
    const mt = num(row, "Max_Temp_C");
    if (mt !== null) {
      maxTempSum += mt;
      maxTempCount += 1;
    }
    const hi = num(row, "Heat_Index_C");
    if (hi !== null && hi > maxHeatIndex) maxHeatIndex = hi;
  }

  const total = rows.length;
  return {
    total,
    heatwaveEvents: heatwave,
    heatwaveRate: total > 0 ? (heatwave / total) * 100 : 0,
    cities: citySet.size,
    avgMaxTemp: maxTempCount > 0 ? maxTempSum / maxTempCount : 0,
    maxHeatIndex: Number.isFinite(maxHeatIndex) ? maxHeatIndex : 0,
  };
}

/* ------------------------------- trends ---------------------------------- */

export type Grain = "day" | "month" | "year";

export interface TrendPoint {
  key: string;
  heatwaveEvents: number;
  totalRecords: number;
  heatwaveRate: number;
}

function bucketKey(date: string, grain: Grain): string {
  if (grain === "year") return date.slice(0, 4);
  if (grain === "month") return date.slice(0, 7);
  return date;
}

/** Heatwave activity per day / month / year (monthly by default in UI). */
export function heatwaveTrend(rows: Row[], grain: Grain): TrendPoint[] {
  const map = new Map<string, { hw: number; total: number }>();
  for (const row of rows) {
    const date = row[IDX.Date] as string;
    if (!date) continue;
    const key = bucketKey(date, grain);
    let bucket = map.get(key);
    if (!bucket) {
      bucket = { hw: 0, total: 0 };
      map.set(key, bucket);
    }
    bucket.total += 1;
    if (isHeatwave(row)) bucket.hw += 1;
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, b]) => ({
      key,
      heatwaveEvents: b.hw,
      totalRecords: b.total,
      heatwaveRate: b.total > 0 ? (b.hw / b.total) * 100 : 0,
    }));
}

export interface TempPoint {
  key: string;
  avgMaxTemp: number;
  avgTemp: number;
}

/** Average max/avg temperature per day / month / year. */
export function temperatureTrend(rows: Row[], grain: Grain): TempPoint[] {
  const map = new Map<string, { maxSum: number; avgSum: number; n: number }>();
  for (const row of rows) {
    const date = row[IDX.Date] as string;
    if (!date) continue;
    const key = bucketKey(date, grain);
    let bucket = map.get(key);
    if (!bucket) {
      bucket = { maxSum: 0, avgSum: 0, n: 0 };
      map.set(key, bucket);
    }
    const mt = num(row, "Max_Temp_C");
    const at = num(row, "Avg_Temp_C");
    if (mt !== null) bucket.maxSum += mt;
    if (at !== null) bucket.avgSum += at;
    bucket.n += 1;
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, b]) => ({
      key,
      avgMaxTemp: b.n > 0 ? b.maxSum / b.n : 0,
      avgTemp: b.n > 0 ? b.avgSum / b.n : 0,
    }));
}

/* --------------------------- severity donut ------------------------------- */

export interface SeveritySlice {
  name: Severity;
  value: number;
}

export function severityDistribution(rows: Row[]): SeveritySlice[] {
  const counts: Record<Severity, number> = { Moderate: 0, Severe: 0, Extreme: 0 };
  for (const row of rows) {
    const sev = row[IDX.Heatwave_Severity] as number;
    if (sev >= 0) {
      const name = (["Moderate", "Severe", "Extreme"] as Severity[])[sev];
      if (name) counts[name] += 1;
    }
  }
  return [
    { name: "Moderate", value: counts.Moderate },
    { name: "Severe", value: counts.Severe },
    { name: "Extreme", value: counts.Extreme },
  ];
}

/* --------------------------- city ranking -------------------------------- */

export type CityMetric = "heatwaveEvents" | "avgHeatIndex" | "avgMaxTemp";

export interface CityRankingEntry {
  city: string;
  state: string;
  heatwaveEvents: number;
  avgHeatIndex: number;
  avgMaxTemp: number;
  records: number;
  heatwaveRate: number;
  maxHeatIndex: number;
}

interface CityAcc {
  records: number;
  hw: number;
  hiSum: number;
  hiN: number;
  maxTempSum: number;
  maxTempN: number;
  maxHi: number;
  stateIdx: number;
}

/** Per-city aggregates computed in a single pass over the given rows. */
export function cityRanking(rows: Row[], ds: Dataset): CityRankingEntry[] {
  const map = new Map<number, CityAcc>();

  for (const row of rows) {
    const cityIdx = row[IDX.City] as number;
    let b = map.get(cityIdx);
    if (!b) {
      b = {
        records: 0,
        hw: 0,
        hiSum: 0,
        hiN: 0,
        maxTempSum: 0,
        maxTempN: 0,
        maxHi: Number.NEGATIVE_INFINITY,
        stateIdx: row[IDX.State] as number,
      };
      map.set(cityIdx, b);
    }
    b.records += 1;
    if (isHeatwave(row)) b.hw += 1;
    const hi = num(row, "Heat_Index_C");
    if (hi !== null) {
      b.hiSum += hi;
      b.hiN += 1;
      if (hi > b.maxHi) b.maxHi = hi;
    }
    const mt = num(row, "Max_Temp_C");
    if (mt !== null) {
      b.maxTempSum += mt;
      b.maxTempN += 1;
    }
  }

  return [...map.entries()]
    .map(([cityIdx, b]) => ({
      city: ds.dictionaries.City[cityIdx] ?? "Unknown",
      state: ds.dictionaries.State[b.stateIdx] ?? "Unknown",
      records: b.records,
      heatwaveEvents: b.hw,
      heatwaveRate: b.records > 0 ? (b.hw / b.records) * 100 : 0,
      avgHeatIndex: b.hiN > 0 ? b.hiSum / b.hiN : 0,
      avgMaxTemp: b.maxTempN > 0 ? b.maxTempSum / b.maxTempN : 0,
      maxHeatIndex: Number.isFinite(b.maxHi) ? b.maxHi : 0,
    }))
    .sort((a, b) => b.heatwaveEvents - a.heatwaveEvents);
}

export function sortCitiesBy(
  entries: CityRankingEntry[],
  metric: CityMetric
): CityRankingEntry[] {
  return [...entries].sort((a, b) => b[metric] - a[metric]);
}

/* --------------------------- scatter sample ------------------------------ */

export interface ScatterPoint {
  avgTemp: number;
  heatIndex: number;
  city: string;
  severity: string;
}

/**
 * Evenly-strided sample of the filtered rows for the scatter chart so we
 * never push 50,000 SVG circles into the DOM.
 */
export function scatterSample(
  rows: Row[],
  ds: Dataset,
  maxPoints = 800
): ScatterPoint[] {
  if (rows.length === 0) return [];
  const step = Math.max(1, Math.floor(rows.length / maxPoints));
  const out: ScatterPoint[] = [];
  for (let i = 0; i < rows.length; i += step) {
    const row = rows[i];
    const avgTemp = num(row, "Avg_Temp_C");
    const heatIndex = num(row, "Heat_Index_C");
    if (avgTemp === null || heatIndex === null) continue;
    const sev = severityOfSafe(ds, row);
    out.push({
      avgTemp,
      heatIndex,
      city: cityNameSafe(ds, row),
      severity: sev ?? "Non-heatwave",
    });
  }
  return out;
}

function severityOfSafe(ds: Dataset, row: Row): Severity | null {
  const i = row[IDX.Heatwave_Severity] as number;
  if (i < 0) return null;
  return (ds.dictionaries.Heatwave_Severity[i] as Severity) ?? null;
}

function cityNameSafe(ds: Dataset, row: Row): string {
  const i = row[IDX.City] as number;
  return ds.dictionaries.City[i] ?? "Unknown";
}

/* ------------------------- weather factors -------------------------------- */

export interface WeatherFactorRow {
  factor: string;
  unit: string;
  normal: number; // non-heatwave average
  heatwave: number; // heatwave average
  moderate: number;
  severe: number;
  extreme: number;
  max: number; // max observed value (for chart domain)
}

type FactorKey =
  | "Relative_Humidity"
  | "Wind_Speed"
  | "Rainfall"
  | "Solar_Radiation"
  | "Cloud_Cover";

const FACTORS: { key: FactorKey; label: string; unit: string }[] = [
  { key: "Relative_Humidity", label: "Relative Humidity", unit: "%" },
  { key: "Wind_Speed", label: "Wind Speed", unit: "km/h" },
  { key: "Rainfall", label: "Rainfall", unit: "mm" },
  { key: "Solar_Radiation", label: "Solar Radiation", unit: "W/m²" },
  { key: "Cloud_Cover", label: "Cloud Cover", unit: "%" },
];

interface FactorAcc {
  normalSum: number;
  normalN: number;
  hwSum: number;
  hwN: number;
  sevSum: [number, number, number];
  sevN: [number, number, number];
  max: number;
}

/**
 * Average of each weather factor grouped by heatwave status/severity,
 * derived from the filtered rows in a single pass.
 */
export function weatherFactors(rows: Row[]): WeatherFactorRow[] {
  const acc: FactorAcc[] = FACTORS.map(() => ({
    normalSum: 0,
    normalN: 0,
    hwSum: 0,
    hwN: 0,
    sevSum: [0, 0, 0],
    sevN: [0, 0, 0],
    max: Number.NEGATIVE_INFINITY,
  }));

  for (const row of rows) {
    const hw = isHeatwave(row);
    const sevIdx = row[IDX.Heatwave_Severity] as number;
    for (let f = 0; f < FACTORS.length; f++) {
      const v = num(row, FACTORS[f].key);
      if (v === null) continue;
      if (v > acc[f].max) acc[f].max = v;
      if (hw) {
        acc[f].hwSum += v;
        acc[f].hwN += 1;
        if (sevIdx >= 0) {
          acc[f].sevSum[sevIdx] += v;
          acc[f].sevN[sevIdx] += 1;
        }
      } else {
        acc[f].normalSum += v;
        acc[f].normalN += 1;
      }
    }
  }

  return FACTORS.map((def, f) => ({
    factor: def.label,
    unit: def.unit,
    normal: acc[f].normalN > 0 ? acc[f].normalSum / acc[f].normalN : 0,
    heatwave: acc[f].hwN > 0 ? acc[f].hwSum / acc[f].hwN : 0,
    moderate: acc[f].sevN[0] > 0 ? acc[f].sevSum[0] / acc[f].sevN[0] : 0,
    severe: acc[f].sevN[1] > 0 ? acc[f].sevSum[1] / acc[f].sevN[1] : 0,
    extreme: acc[f].sevN[2] > 0 ? acc[f].sevSum[2] / acc[f].sevN[2] : 0,
    max: Number.isFinite(acc[f].max) ? acc[f].max : 0,
  }));
}

/* --------------------------- geo aggregation ----------------------------- */

export interface GeoPoint {
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  records: number;
  heatwaveEvents: number;
  heatwaveRate: number;
  avgHeatIndex: number;
  avgMaxTemp: number;
  maxSeverity: Severity | null;
}

interface GeoAcc {
  latSum: number;
  lonSum: number;
  n: number;
  records: number;
  hw: number;
  hiSum: number;
  hiN: number;
  tempSum: number;
  tempN: number;
  stateIdx: number;
  countryIdx: number;
  maxSev: number;
}

/**
 * One marker per city (10 markers, never 50,000). Coordinates are the mean
 * of the Latitude/Longitude cells recorded for that city.
 */
export function geoPoints(rows: Row[], ds: Dataset): GeoPoint[] {
  const map = new Map<number, GeoAcc>();

  for (const row of rows) {
    const cityIdx = row[IDX.City] as number;
    let b = map.get(cityIdx);
    if (!b) {
      b = {
        latSum: 0,
        lonSum: 0,
        n: 0,
        records: 0,
        hw: 0,
        hiSum: 0,
        hiN: 0,
        tempSum: 0,
        tempN: 0,
        stateIdx: row[IDX.State] as number,
        countryIdx: row[IDX.Country] as number,
        maxSev: -1,
      };
      map.set(cityIdx, b);
    }
    const lat = num(row, "Latitude");
    const lon = num(row, "Longitude");
    if (lat !== null && lon !== null) {
      b.latSum += lat;
      b.lonSum += lon;
      b.n += 1;
    }
    b.records += 1;
    if (isHeatwave(row)) {
      b.hw += 1;
      const sev = row[IDX.Heatwave_Severity] as number;
      if (sev > b.maxSev) b.maxSev = sev;
    }
    const hi = num(row, "Heat_Index_C");
    if (hi !== null) {
      b.hiSum += hi;
      b.hiN += 1;
    }
    const mt = num(row, "Max_Temp_C");
    if (mt !== null) {
      b.tempSum += mt;
      b.tempN += 1;
    }
  }

  const sevNames: Severity[] = ["Moderate", "Severe", "Extreme"];
  return [...map.entries()]
    .map(([cityIdx, b]) => ({
      city: ds.dictionaries.City[cityIdx] ?? "Unknown",
      state: ds.dictionaries.State[b.stateIdx] ?? "Unknown",
      country: ds.dictionaries.Country[b.countryIdx] ?? "Unknown",
      lat: b.n > 0 ? b.latSum / b.n : 0,
      lon: b.n > 0 ? b.lonSum / b.n : 0,
      records: b.records,
      heatwaveEvents: b.hw,
      heatwaveRate: b.records > 0 ? (b.hw / b.records) * 100 : 0,
      avgHeatIndex: b.hiN > 0 ? b.hiSum / b.hiN : 0,
      avgMaxTemp: b.tempN > 0 ? b.tempSum / b.tempN : 0,
      maxSeverity: b.maxSev >= 0 ? sevNames[b.maxSev] : null,
    }))
    .sort((a, b) => b.heatwaveEvents - a.heatwaveEvents);
}



