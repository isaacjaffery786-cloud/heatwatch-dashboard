import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Server-only Supabase client.
//
// Secrets (database URL, anon key, service-role key) are read ONLY from
// environment variables. They are never hardcoded, never printed, and never
// exposed to client code. The .env.local file is git-ignored.
//
// Required environment variables (see .env.local.example):
//   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
//   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   (server-only, bypasses RLS)
//
// IMPORTANT: the service-role key MUST stay in process.env and must never be
// committed to source control or bundled into client bundles.
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // Avoid process.exit() in a route; fail gracefully with a 500.
  console.error(
    "[api/records] Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  throw new Error("Supabase configuration missing");
}

// service_role has bypassrls; no RLS policy is required for this read.
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Corrected Supabase column names. Verified against the target table DDL:
//   record_id, record_date, record_time, latitude, longitude, city, state,
//   country, max_temp_c, min_temp_c, avg_temp_c, relative_humidity,
//   wind_speed_kmph, pressure_hpa, rainfall_mm, solar_radiation_wm2,
//   cloud_cover, heat_index_c, heatwave_label, heatwave_severity
const SUPABASE_COLUMNS = [
  "record_id",
  "record_date",
  "record_time",
  "latitude",
  "longitude",
  "city",
  "state",
  "country",
  "max_temp_c",
  "min_temp_c",
  "avg_temp_c",
  "relative_humidity",
  "wind_speed_kmph",
  "pressure_hpa",
  "rainfall_mm",
  "solar_radiation_wm2",
  "cloud_cover",
  "heat_index_c",
  "heatwave_label",
  "heatwave_severity",
];

// Exact original dashboard column names, in the order expected by
// src/lib/dataLoader.ts and src/lib/dataset.ts (COLUMN_INDEX).
const DASHBOARD_COLUMNS = [
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
];

// Verify the two lists are the same length to avoid silent mis-mapping.
if (SUPABASE_COLUMNS.length !== DASHBOARD_COLUMNS.length) {
  throw new Error(
    `Supabase/Dashboard column count mismatch: ${SUPABASE_COLUMNS.length} vs ${DASHBOARD_COLUMNS.length}`
  );
}

// Map each Supabase column to its matching original JSON column by index.
const SUPABASE_TO_DASHBOARD: number[] = SUPABASE_COLUMNS.map((sup, i) => {
  const dashboardCol = DASHBOARD_COLUMNS[i];
  // Assert each Supabase column has a matching original column name.
  if (!dashboardCol) throw new Error(`Missing dashboard column for ${sup}`);
  return i;
});

// Map Heatwave_Severity text labels to the dashboard's integer codes:
//   NULL / missing / ""  -> -1
//   "Moderate"           -> 0
//   "Severe"             -> 1
//   "Extreme"            -> 2
function mapSeverity(value: unknown): number {
  if (value === null || value === undefined || value === "") return -1;
  const v = String(value).trim().toLowerCase();
  if (v === "moderate") return 0;
  if (v === "severe") return 1;
  if (v === "extreme") return 2;
  return -1; // unknown -> treat as null (non-heatwave)
}

// Pagination: deterministic ordering by record_id, page-based fetch of
// 25 rows per page. Never fetches all 50,000 rows in one request.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const page = Math.max(0, Number(url.searchParams.get("page")) || 0);
  const pageSize = 25;
  const start = page * pageSize;
  const end = start + pageSize - 1;

  const { data, error, count } = await supabase
    .from("heatwave_records")
    .select(
      SUPABASE_COLUMNS.join(","),
      // count: "exact" returns total_rows for this query. head: true is not
      // needed here; count alone is sufficient and correct.
      { count: "exact" }
    )
    .order("record_id", { ascending: true })
    .range(start, end);

  if (error) {
    console.error("[api/records] Supabase query error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch records from Supabase" },
      { status: 502 }
    );
  }

  const records =
    Array.isArray(data) ? (data as unknown as Record<string, unknown>[]) : [];
  const rows = records;

  const nextPage = rows.length > 0 ? page + 1 : null;
  const hasMore =
    nextPage !== null && start + rows.length < (count ?? 50000);

  // Transform each Supabase row into the exact positional-array format the
  // dashboard's dataset loader expects. Supabase returns rows as objects keyed
  // by column name for a .select() query; we cast to the record type below to
  // index by the known column names. Each row becomes an array aligned to
  // DASHBOARD_COLUMNS (the original JSON column order).
  const positionalRows = rows.map((supabaseRow) =>
    DASHBOARD_COLUMNS.map((dashboardCol) => {
      const dashboardIdx = DASHBOARD_COLUMNS.indexOf(dashboardCol);
      const supIndex = SUPABASE_TO_DASHBOARD[dashboardIdx];

      // Cast to a record so we can index by the known column name.
      const raw = (supabaseRow as Record<string, unknown>)[
        SUPABASE_COLUMNS[supIndex]
      ];

      if (dashboardCol === "Heatwave_Severity") {
        return mapSeverity(raw);
      }

      // Preserve original behavior: missing/blank -> null; otherwise pass through.
      if (raw === undefined || raw === null || raw === "") return null;
      return raw;
    })
  );

  return NextResponse.json({
    columns: DASHBOARD_COLUMNS, // original dashboard column names, exact order
    rows: positionalRows, // positional arrays aligned to DASHBOARD_COLUMNS
    page,
    pageSize,
    total: count ?? 50000,
    nextPage,
    hasMore,
  });
}
