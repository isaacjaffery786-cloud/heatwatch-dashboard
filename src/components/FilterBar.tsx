import { CalendarRange, Filter, RotateCcw } from "lucide-react";
import type { Filters } from "@/lib/analytics";
import { DEFAULT_FILTERS } from "@/lib/analytics";
import type { Dataset } from "@/lib/dataset";

interface FilterBarProps {
  ds: Dataset;
  filters: Filters;
  onChange: (f: Filters) => void;
  resultCount: number;
}

export default function FilterBar({ ds, filters, onChange, resultCount }: FilterBarProps) {
  const cities = ds.dictionaries.City;
  const states = ds.dictionaries.State;
  const severities = ds.dictionaries.Heatwave_Severity;
  const dateMin = ds.dateRange?.min ?? "";
  const dateMax = ds.dateRange?.max ?? "";

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  const isDirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="hw-card px-4 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="h-4 w-4 text-orange-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Dashboard Filters
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-orange-400">
            {resultCount.toLocaleString("en-US")} of{" "}
            {ds.rowCount.toLocaleString("en-US")} records
          </span>
          {isDirty && (
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_FILTERS })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div>
          <label className="hw-label" htmlFor="f-from">
            <CalendarRange className="mr-1 inline h-3 w-3" aria-hidden="true" />
            From date
          </label>
          <input
            id="f-from"
            type="date"
            className="hw-input"
            min={dateMin}
            max={filters.to ?? dateMax}
            value={filters.from ?? ""}
            onChange={(e) => set("from", e.target.value || null)}
          />
        </div>
        <div>
          <label className="hw-label" htmlFor="f-to">
            <CalendarRange className="mr-1 inline h-3 w-3" aria-hidden="true" />
            To date
          </label>
          <input
            id="f-to"
            type="date"
            className="hw-input"
            min={filters.from ?? dateMin}
            max={dateMax}
            value={filters.to ?? ""}
            onChange={(e) => set("to", e.target.value || null)}
          />
        </div>
        <div>
          <label className="hw-label" htmlFor="f-state">
            State
          </label>
          <select
            id="f-state"
            className="hw-input"
            value={filters.state}
            onChange={(e) => onChange({ ...filters, state: e.target.value, city: "all" })}
          >
            <option value="all">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="hw-label" htmlFor="f-city">
            City
          </label>
          <select
            id="f-city"
            className="hw-input"
            value={filters.city}
            onChange={(e) => set("city", e.target.value)}
          >
            <option value="all">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="hw-label" htmlFor="f-status">
            Heatwave status
          </label>
          <select
            id="f-status"
            className="hw-input"
            value={filters.status}
            onChange={(e) =>
              set("status", e.target.value as Filters["status"])
            }
          >
            <option value="all">All records</option>
            <option value="heatwave">Heatwave only</option>
            <option value="normal">Non-heatwave only</option>
          </select>
        </div>
        <div>
          <label className="hw-label" htmlFor="f-severity">
            Severity
          </label>
          <select
            id="f-severity"
            className="hw-input"
            value={filters.severity}
            onChange={(e) => set("severity", e.target.value as Filters["severity"])}
          >
            <option value="all">All severities</option>
            {severities.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
