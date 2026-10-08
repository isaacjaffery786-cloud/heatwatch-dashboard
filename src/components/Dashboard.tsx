"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Map as MapIcon } from "lucide-react";
import AlertPanel from "./AlertPanel";
import CityRankingChart from "./CityRankingChart";
import DataTable from "./DataTable";
import FilterBar from "./FilterBar";
import Footer from "./Footer";
import GeoMapSection from "./GeoMapSection";
import Header from "./Header";
import HeatwaveTrendChart from "./HeatwaveTrendChart";
import InsightsSection from "./InsightsSection";
import KpiCards from "./KpiCards";
import SeverityDonut from "./SeverityDonut";
import TempVsHeatIndexScatter from "./TempVsHeatIndexScatter";
import TemperatureTrendChart from "./TemperatureTrendChart";
import WeatherFactorsChart from "./WeatherFactorsChart";
import { EmptyState, ErrorState, LoadingState } from "./States";
import { DEFAULT_FILTERS, computeKpis, filterRows, geoPoints } from "@/lib/analytics";
import type { Filters } from "@/lib/analytics";
import type { Dataset } from "@/lib/dataset";
import { loadDataset } from "@/lib/dataLoader";

type Status =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; ds: Dataset };

export default function Dashboard() {
  const [status, setStatus] = useState<Status>({ phase: "loading" });
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus({ phase: "loading" });
    loadDataset()
      .then((ds) => {
        if (!cancelled) setStatus({ phase: "ready", ds });
      })
      .catch((err: Error) => {
        if (!cancelled) setStatus({ phase: "error", message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  // All heavy derivation below is memoized on (rows, filters) so filtering
  // 50,000 records happens once per filter change, not on every render.
  const derived = useMemo(() => {
    if (status.phase !== "ready") return null;
    const ds = status.ds;
    const rows = filterRows(ds, filters);
    return {
      ds,
      rows,
      kpis: computeKpis(rows),
      geo: geoPoints(rows, ds),
    };
  }, [status, filters]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header recordCount={status.phase === "ready" ? status.ds.rowCount : null} />

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {status.phase === "loading" && (
          <LoadingState message="Loading HEATWATCH dataset" />
        )}

        {status.phase === "error" && (
          <ErrorState message={status.message} onRetry={retry} />
        )}

        {status.phase === "ready" && derived && (
          <>
            <FilterBar
              ds={derived.ds}
              filters={filters}
              onChange={setFilters}
              resultCount={derived.rows.length}
            />

            {derived.rows.length === 0 ? (
              <EmptyState
                title="No records match the current filters"
                hint="Try widening the date range or clearing the city / severity filters."
                action={
                  <button
                    type="button"
                    onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    Reset all filters
                  </button>
                }
              />
            ) : (
              <>
                <KpiCards kpis={derived.kpis} />

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <HeatwaveTrendChart rows={derived.rows} />
                  <TemperatureTrendChart rows={derived.rows} />
                  <SeverityDonut rows={derived.rows} />
                  <CityRankingChart rows={derived.rows} ds={derived.ds} />
                  <TempVsHeatIndexScatter rows={derived.rows} ds={derived.ds} />
                  <WeatherFactorsChart rows={derived.rows} />
                </div>

                <div className="flex items-center gap-2 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <MapIcon className="h-4 w-4 text-orange-400" aria-hidden="true" />
                  Monitoring &amp; response
                </div>

                <GeoMapSection points={derived.geo} />
                <AlertPanel rows={derived.rows} ds={derived.ds} />
                <InsightsSection rows={derived.rows} ds={derived.ds} />
                <DataTable rows={derived.rows} ds={derived.ds} />
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
