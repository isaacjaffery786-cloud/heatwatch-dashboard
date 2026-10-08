import type { Dataset } from "./dataset";

/**
 * The Excel file is parsed exactly once at build/dev time by
 * scripts/preprocess.mjs, which writes public/data/heatwatch.json.
 * At runtime the dashboard only fetches that JSON, and the promise is cached
 * so concurrent components share a single request/parse.
 */
let cached: Promise<Dataset> | null = null;

export function loadDataset(): Promise<Dataset> {
  if (!cached) {
    cached = fetch("/data/heatwatch.json", { cache: "force-cache" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load dataset (HTTP ${res.status})`);
        }
        const data = (await res.json()) as Dataset;
        if (!data || !Array.isArray(data.rows) || !Array.isArray(data.columns)) {
          throw new Error("Dataset file is malformed");
        }
        if (data.rows.length === 0) {
          throw new Error("Dataset contains no records");
        }
        return data;
      })
      .catch((err) => {
        cached = null; // allow retry after failure
        throw err instanceof Error ? err : new Error(String(err));
      });
  }
  return cached;
}
