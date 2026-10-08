/**
 * HEATWATCH preprocessing script
 * Reads the Excel dataset ONCE and writes public/data/heatwatch.json so the
 * React runtime never parses the workbook.
 * Usage: npm run preprocess  |  npm run preprocess -- path/to/file.xlsx
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import * as XLSX from "xlsx";

const COLUMNS = [
  "Record_ID", "Date", "Time", "Latitude", "Longitude", "City", "State",
  "Country", "Max_Temp_C", "Min_Temp_C", "Avg_Temp_C", "Relative_Humidity_%",
  "Wind_Speed_kmph", "Pressure_hPa", "Rainfall_mm", "Solar_Radiation_Wm2",
  "Cloud_Cover_%", "Heat_Index_C", "Heatwave_Label", "Heatwave_Severity",
];

const NUMERIC_COLUMNS = new Set([
  "Record_ID", "Latitude", "Longitude", "Max_Temp_C", "Min_Temp_C",
  "Avg_Temp_C", "Relative_Humidity_%", "Wind_Speed_kmph", "Pressure_hPa",
  "Rainfall_mm", "Solar_Radiation_Wm2", "Cloud_Cover_%", "Heat_Index_C",
  "Heatwave_Label",
]);

const CATEGORICAL_COLUMNS = ["City", "State", "Country"];
const SEVERITY_ORDER = ["Moderate", "Severe", "Extreme"];

function resolveSourcePath() {
  const candidates = [
    process.argv[2],
    path.join(process.cwd(), "dataset", "Heatwave_Monitoring_Dataset_50000.xlsx"),
    path.join(process.cwd(), "Heatwave_Monitoring_Dataset_50000.xlsx"),
    path.join("C:", "Users", "isaac", "Downloads", "Heatwave_Monitoring_Dataset_50000.xlsx"),
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    console.error("[preprocess] Excel dataset not found. Run: npm run preprocess -- <path-to-xlsx>");
    process.exit(1);
  }
  return found;
}

const pad2 = (n) => String(n).padStart(2, "0");

function isoFromParts(y, m, d) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function serialToISO(serial) {
  // Excel serial -> UTC date (base 1899-12-30 accounts for the 1900 leap-year bug)
  const days = Math.floor(serial);
  const ms = Math.round((serial - days) * 86400000);
  const d = new Date(Date.UTC(1899, 11, 30) + days * 86400000 + ms);
  return isoFromParts(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

function formatDateCell(v) {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) {
    return isoFromParts(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
  }
  if (typeof v === "number" && Number.isFinite(v)) return serialToISO(v);
  const s = String(v).trim();
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return isoFromParts(Number(m[1]), Number(m[2]), Number(m[3]));
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const day = a > 12 ? a : b > 12 ? b : a;
    const month = a > 12 ? b : b > 12 ? a : b;
    return isoFromParts(Number(m[3]), month, day);
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return isoFromParts(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, parsed.getUTCDate());
  }
  return s;
}

function formatTimeCell(v) {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return `${pad2(v.getUTCHours())}:${pad2(v.getUTCMinutes())}`;
  if (typeof v === "number" && Number.isFinite(v)) {
    const totalSeconds = Math.round((v - Math.floor(v)) * 86400);
    const h = Math.floor(totalSeconds / 3600) % 24;
    const min = Math.floor((totalSeconds % 3600) / 60);
    return `${pad2(h)}:${pad2(min)}`;
  }
  const s = String(v).trim();
  const ampm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]\.?$/);
  if (ampm) {
    let h = Number(ampm[1]) % 12;
    if (ampm[4].toLowerCase() === "p") h += 12;
    return `${pad2(h)}:${ampm[2]}`;
  }
  const h24 = s.match(/^(\d{1,2}):(\d{2})/);
  if (h24) return `${pad2(Number(h24[1]))}:${h24[2]}`;
  return s;
}

function toNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(String(v).trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function toText(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/* ------------------------------- main ------------------------------------ */

const source = resolveSourcePath();
console.log(`[preprocess] Reading: ${source}`);

const workbook = XLSX.read(fs.readFileSync(source), { type: "buffer", cellDates: false });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
if (!sheet) {
  console.error("[preprocess] First sheet not found in workbook.");
  process.exit(1);
}

const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
if (rawRows.length === 0) {
  console.error("[preprocess] Sheet contains no data rows.");
  process.exit(1);
}

const sheetHeaders = Object.keys(rawRows[0]);
const missing = COLUMNS.filter((c) => !sheetHeaders.includes(c));
if (missing.length > 0) {
  console.error(`[preprocess] Missing expected columns: ${missing.join(", ")}`);
  console.error(`[preprocess] Found headers: ${sheetHeaders.join(", ")}`);
  process.exit(1);
}

// sorted dictionaries for categorical columns (stable, alphabetical)
const categoricalValues = {};
for (const col of CATEGORICAL_COLUMNS) {
  const set = new Set();
  for (const r of rawRows) {
    const v = toText(r[col]);
    if (v !== null) set.add(v);
  }
  categoricalValues[col] = [...set].sort((a, b) => a.localeCompare(b));
}
const severityValues = [...SEVERITY_ORDER];

const dictIndex = {};
for (const col of CATEGORICAL_COLUMNS) {
  dictIndex[col] = new Map(categoricalValues[col].map((v, i) => [v, i]));
}
dictIndex.Heatwave_Severity = new Map(severityValues.map((v, i) => [v, i]));

const rows = [];
let dateMin = null;
let dateMax = null;
let heatwaveCount = 0;
const severityCounts = { Moderate: 0, Severe: 0, Extreme: 0 };
const unknownSeverities = new Set();

for (const raw of rawRows) {
  const row = new Array(COLUMNS.length);
  for (let c = 0; c < COLUMNS.length; c++) {
    const col = COLUMNS[c];
    const value = raw[col];
    if (col === "Date") {
      row[c] = formatDateCell(value);
      if (row[c]) {
        if (dateMin === null || row[c] < dateMin) dateMin = row[c];
        if (dateMax === null || row[c] > dateMax) dateMax = row[c];
      }
    } else if (col === "Time") {
      row[c] = formatTimeCell(value);
    } else if (NUMERIC_COLUMNS.has(col)) {
      row[c] = toNumber(value);
    } else if (col === "Heatwave_Severity") {
      const v = toText(value);
      const blank =
        v === null ||
        v.toLowerCase() === "none" ||
        v.toLowerCase() === "null" ||
        v === "-1";
      if (blank) {
        row[c] = -1;
      } else {
        const match = severityValues.find((s) => s.toLowerCase() === v.toLowerCase());
        if (match) {
          row[c] = dictIndex.Heatwave_Severity.get(match);
          severityCounts[match] += 1;
        } else {
          unknownSeverities.add(v);
          row[c] = -1;
        }
      }
    } else {
      const v = toText(value);
      const idx = v === null ? -1 : dictIndex[col].get(v);
      row[c] = idx === undefined ? -1 : idx;
    }
  }
  if (row[COLUMNS.indexOf("Heatwave_Label")] === 1) heatwaveCount += 1;
  rows.push(row);
}

const payload = {
  version: 1,
  sourceFile: path.basename(source),
  generatedAt: new Date().toISOString(),
  rowCount: rows.length,
  dateRange: { min: dateMin, max: dateMax },
  columns: COLUMNS,
  dictionaries: {
    City: categoricalValues.City,
    State: categoricalValues.State,
    Country: categoricalValues.Country,
    Heatwave_Severity: severityValues,
  },
  rows,
};

const outDir = path.join(process.cwd(), "public", "data");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "heatwatch.json");
fs.writeFileSync(outFile, JSON.stringify(payload));

const stats = {
  records: rows.length,
  dateMin,
  dateMax,
  cities: categoricalValues.City.length,
  states: categoricalValues.State.length,
  countries: categoricalValues.Country.length,
  heatwave: heatwaveCount,
  heatwaveRate: `${((heatwaveCount / rows.length) * 100).toFixed(2)}%`,
  severityCounts,
};

console.log("[preprocess] Stats:", JSON.stringify(stats, null, 2));
if (unknownSeverities.size > 0) {
  console.warn("[preprocess] Unknown severity labels ignored:", [...unknownSeverities]);
}
console.log(`[preprocess] Wrote ${outFile} (${(fs.statSync(outFile).size / 1024 / 1024).toFixed(2)} MB)`);

