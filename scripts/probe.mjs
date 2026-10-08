/**
 * Quick inspection of the raw Excel dataset (headers, sample rows, value types).
 * Usage: node scripts/probe.mjs [path-to-xlsx]
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import * as XLSX from "xlsx";

const candidates = [
  process.argv[2],
  path.join(process.cwd(), "dataset", "Heatwave_Monitoring_Dataset_50000.xlsx"),
  path.join("C:", "Users", "isaac", "Downloads", "Heatwave_Monitoring_Dataset_50000.xlsx"),
].filter(Boolean);
const source = candidates.find((p) => fs.existsSync(p));
if (!source) {
  console.error("dataset not found");
  process.exit(1);
}

const workbook = XLSX.read(fs.readFileSync(source), { type: "buffer", cellDates: false });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });

console.log("sheet:", workbook.SheetNames[0]);
console.log("row count:", rows.length);
console.log("headers:", Object.keys(rows[0]).join(" | "));
console.log("\nsample rows:");
for (const r of [rows[0], rows[1], rows[25000]]) {
  console.log(JSON.stringify(r, null, 0));
}
console.log("\nvalue types of first row:");
for (const [k, v] of Object.entries(rows[0])) {
  console.log(`  ${k}: ${typeof v} -> ${JSON.stringify(v)}`);
}
const labels = new Set(rows.map((r) => String(r.Heatwave_Label)));
const sevs = new Set(rows.map((r) => String(r.Heatwave_Severity)));
console.log("distinct Heatwave_Label:", [...labels]);
console.log("distinct Heatwave_Severity:", [...sevs]);
