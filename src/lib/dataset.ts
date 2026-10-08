/**
 * Dataset shape produced by scripts/preprocess.mjs.
 * Rows are stored as positional arrays (not objects) so that 50,000 records
 * stay compact in memory and cheap to filter/aggregate.
 */

export const COLUMNS = [
  "Record_ID",
  "Date",
  "Time",
  "Latitude",
  "Longitude",
  "City",
  "State",
  "Country",
  "Max_Temp_C",
  "Min_Temp_C",
  "Avg_Temp_C",
  "Relative_Humidity_%",
  "Wind_Speed_kmph",
  "Pressure_hPa",
  "Rainfall_mm",
  "Solar_Radiation_Wm2",
  "Cloud_Cover_%",
  "Heat_Index_C",
  "Heatwave_Label",
  "Heatwave_Severity",
] as const;

export type ColumnName = (typeof COLUMNS)[number];

/** Positional index of every column inside a row array. */
export const IDX = {
  Record_ID: 0,
  Date: 1,
  Time: 2,
  Latitude: 3,
  Longitude: 4,
  City: 5,
  State: 6,
  Country: 7,
  Max_Temp_C: 8,
  Min_Temp_C: 9,
  Avg_Temp_C: 10,
  Relative_Humidity: 11,
  Wind_Speed: 12,
  Pressure: 13,
  Rainfall: 14,
  Solar_Radiation: 15,
  Cloud_Cover: 16,
  Heat_Index_C: 17,
  Heatwave_Label: 18,
  Heatwave_Severity: 19,
} as const;

export type Cell = number | string | null;
export type Row = Cell[];

export type Severity = "Moderate" | "Severe" | "Extreme";

export interface Dictionaries {
  City: string[];
  State: string[];
  Country: string[];
  Heatwave_Severity: string[];
}

export interface Dataset {
  version: number;
  sourceFile?: string;
  generatedAt?: string;
  rowCount: number;
  dateRange?: { min: string | null; max: string | null };
  columns: string[];
  dictionaries: Dictionaries;
  rows: Row[];
}

export const SEVERITIES: Severity[] = ["Moderate", "Severe", "Extreme"];

export const SEVERITY_COLORS: Record<Severity, string> = {
  Moderate: "#f59e0b",
  Severe: "#f97316",
  Extreme: "#ef4444",
};

export function cityName(ds: Dataset, row: Row): string {
  const i = row[IDX.City] as number;
  return ds.dictionaries.City[i] ?? "Unknown";
}

export function stateName(ds: Dataset, row: Row): string {
  const i = row[IDX.State] as number;
  return ds.dictionaries.State[i] ?? "Unknown";
}

export function severityOf(ds: Dataset, row: Row): Severity | null {
  const i = row[IDX.Heatwave_Severity] as number;
  if (i < 0) return null;
  const name = ds.dictionaries.Heatwave_Severity[i];
  return (name as Severity) ?? null;
}

export function isHeatwave(row: Row): boolean {
  return row[IDX.Heatwave_Label] === 1;
}

/** Numeric cell accessor that returns null for missing values. */
export function num(row: Row, key: keyof typeof IDX): number | null {
  const v = row[IDX[key]];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
