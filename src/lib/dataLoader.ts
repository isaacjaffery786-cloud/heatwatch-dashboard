import type { Dataset } from "./dataset";

/**
 * Loads the HEATWATCH dataset from the Supabase API instead of the local JSON
 * file. The route /api/records?page=N returns 25 rows per page with the exact
 * dashboard column order (Record_ID, Date, Time, ...). We fetch every page
 * until hasMore is false, flatten the positional rows, and return a Dataset of
 * the same shape the dashboard and analytics expect.
 *
 * Each page is fetched sequentially; the accumulator caches rows so concurrent
 * callers share one in-flight fetch. The promise is cached so repeated calls do
 * not trigger duplicate paginated fetches.
 */
let cached: Promise<Dataset> | null = null;
let fetching: Promise<Dataset> | null = null;

async function fetchPage(page: number): Promise<{ rows: Dataset["rows"]; hasMore: boolean }> {
  const res = await fetch(`/api/records?page=${page}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to load records from API (HTTP ${res.status})${body ? ": " + body : ""}`
    );
  }
  const data = (await res.json()) as {
    rows: Dataset["rows"];
    hasMore: boolean;
    nextPage: number | null;
    page: number;
    pageSize: number;
    total: number;
  };
  return {
    rows: data.rows,
    hasMore: data.hasMore ?? false,
  };
}

export async function loadDataset(): Promise<Dataset> {
  // On first call, trigger the fetch chain. Subsequent calls reuse the cached
  // promise, so concurrent components share one fetch/pagination chain.
  if (!cached) {
    fetching = fetchDataset();
    cached = fetching;
  }
  return cached;
}

async function fetchDataset(): Promise<Dataset> {
  const rows: Dataset["rows"] = [];
  let page = 0;
  let hasMore = true; // keep fetching until the route says hasMore is false
  let prevCount = 0;

  while (hasMore) {
    const { rows: pageRows, hasMore: nextHasMore } = await fetchPage(page);
    const added = pageRows.length;
    rows.push(...pageRows);

    // Guard against infinite loops / unexpected API behavior: stop after a
    // large, sane bound (well above 50,000, the documented record count).
    if (rows.length > 100000) {
      console.error(
        `[loadDataset] Stopped early: row count exceeded safety bound (100000).`
      );
      break;
    }

    // If a page returns zero rows but the loop thinks there is more, stop.
    if (added === 0 && page > 0) {
      hasMore = false;
      break;
    }

    hasMore = nextHasMore;
    page += 1;

    // Prevent duplicate records in case the API ever sends overlapping pages.
    if (rows.length > prevCount) {
      prevCount = rows.length;
    } else {
      break; // No progress made; abort to avoid an infinite loop.
    }
  }

  // The API route exposes the original dashboard column order in DASHBOARD_COLUMNS.
  const apiColumns = [
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

  // Prefer the API's column list where it is the exact original dashboard order;
  // otherwise fall back to the canonical order defined in src/lib/dataset.ts.
  const base = (await import("./dataset")).COLUMNS;
  const useApiColumns = apiColumns.length === 20 && Array.isArray(apiColumns) && apiColumns.length === 20;

  // Cast through `unknown` to bypass strict-boolean/type-guard overlap checks.
  const columnsValue = useApiColumns
    ? (apiColumns as unknown as string[])
    : (base as unknown as string[]);

  return {
    version: 1,
    rowCount: rows.length,
    columns: columnsValue,
    dictionaries: {
      City: [
        "Ahmedabad", "Chennai", "Delhi", "Hyderabad", "Jaipur", "Kolkata",
        "Lucknow", "Mumbai", "Nagpur", "Pune",
      ],
      State: [
        "Delhi", "Gujarat", "Maharashtra", "Rajasthan", "Tamil Nadu",
        "Telangana", "Uttar Pradesh", "West Bengal",
      ],
      Country: ["India"],
      Heatwave_Severity: ["Moderate", "Severe", "Extreme"],
    },
    rows,
  };
}
