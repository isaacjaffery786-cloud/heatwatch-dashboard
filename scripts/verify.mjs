/**
 * Verifies that the dashboard's derived numbers come straight from the
 * dataset (no hardcoded values). Run: node scripts/verify.mjs
 */
import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "public", "data", "heatwatch.json");
const ds = JSON.parse(fs.readFileSync(file, "utf8"));

const IDX = {
  City: 5, Max_Temp_C: 8, Avg_Temp_C: 10, Heat_Index_C: 17,
  Heatwave_Label: 18, Heatwave_Severity: 19, Date: 1,
};

let hw = 0, maxTempSum = 0, maxTempN = 0, maxHi = -Infinity, maxTempRecord = null;
const sev = { Moderate: 0, Severe: 0, Extreme: 0 };
const cities = new Set();
for (const r of ds.rows) {
  cities.add(r[IDX.City]);
  if (r[IDX.Heatwave_Label] === 1) {
    hw++;
    const s = r[IDX.Heatwave_Severity];
    if (s >= 0) sev[["Moderate", "Severe", "Extreme"][s]]++;
  }
  const mt = r[IDX.Max_Temp_C];
  if (typeof mt === "number") {
    maxTempSum += mt; maxTempN++;
    if (!maxTempRecord || mt > maxTempRecord.t) maxTempRecord = { t: mt, id: r[0], date: r[IDX.Date] };
  }
  const hi = r[IDX.Heat_Index_C];
  if (typeof hi === "number" && hi > maxHi) maxHi = hi;
}

console.log(JSON.stringify({
  records: ds.rows.length,
  heatwaveEvents: hw,
  heatwaveRate: `${((hw / ds.rows.length) * 100).toFixed(2)}%`,
  severity: sev,
  cities: [...cities].sort(),
  dateRange: ds.dateRange,
  avgMaxTemp: `${(maxTempSum / maxTempN).toFixed(2)} °C`,
  maxHeatIndex: `${maxHi} °C`,
  maxTempRecord,
}, null, 2));
