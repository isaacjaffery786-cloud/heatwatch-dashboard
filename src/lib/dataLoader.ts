import type { Dataset } from "./dataset";
import { COLUMNS } from "./dataset";

const PAGE_SIZE = 1000;
const CONCURRENCY = 5;
const MAX_ROWS = 100000;

type PageResponse = {
  columns: string[];
  rows: Dataset["rows"];
  page: number;
  pageSize: number;
  total: number;
  nextPage: number | null;
  hasMore: boolean;
};

let cached: Promise<Dataset> | null = null;

async function fetchPage(page: number): Promise<PageResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(`/api/records?page=${page}`, {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Failed to load dataset page ${page} (HTTP ${response.status})` +
          (body ? `: ${body.slice(0, 300)}` : "")
      );
    }

    const data = (await response.json()) as PageResponse;

    if (
      data.page !== page ||
      !Array.isArray(data.rows) ||
      typeof data.total !== "number" ||
      typeof data.hasMore !== "boolean"
    ) {
      throw new Error(`Invalid response received for dataset page ${page}.`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Loading dataset page ${page} timed out after 20 seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function loadDataset(): Promise<Dataset> {
  if (!cached) {
    cached = fetchDataset().catch((error) => {
      cached = null;
      console.error("[loadDataset] Dataset loading failed:", error);
      throw error;
    });
  }

  return cached;
}

async function fetchDataset(): Promise<Dataset> {
  const first = await fetchPage(0);
  const total = first.total;

  if (total < 0 || total > MAX_ROWS) {
    throw new Error(`Unexpected dataset size: ${total} records.`);
  }

  if (first.rows.length > PAGE_SIZE || first.rows.length > total) {
    throw new Error("The first dataset page returned an unexpected number of rows.");
  }

  const pages: Dataset["rows"][] = new Array(
    Math.ceil(total / PAGE_SIZE)
  );
  pages[0] = first.rows;

  const pageCount = pages.length;

  for (let startPage = 1; startPage < pageCount; startPage += CONCURRENCY) {
    const pageNumbers = Array.from(
      { length: Math.min(CONCURRENCY, pageCount - startPage) },
      (_, index) => startPage + index
    );

    const results = await Promise.all(pageNumbers.map(fetchPage));

    for (const result of results) {
      if (result.total !== total || result.pageSize !== PAGE_SIZE) {
        throw new Error("Dataset pagination changed while loading. Please retry.");
      }

      if (result.rows.length > PAGE_SIZE) {
        throw new Error(`Dataset page ${result.page} exceeded its page size.`);
      }

      const expectedLength = Math.min(
        PAGE_SIZE,
        total - result.page * PAGE_SIZE
      );

      if (result.rows.length !== expectedLength) {
        throw new Error(
          `Dataset page ${result.page} returned ${result.rows.length} rows; expected ${expectedLength}.`
        );
      }

      pages[result.page] = result.rows;
    }
  }

  const rows = pages.flat();

  if (rows.length !== total) {
    throw new Error(
      `Dataset is incomplete: received ${rows.length} of ${total} records.`
    );
  }

  const columns = [
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

  if (COLUMNS.length !== columns.length) {
    throw new Error("Dashboard column count does not match the API dataset.");
  }

  return {
    version: 1,
    rowCount: rows.length,
    columns,
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
