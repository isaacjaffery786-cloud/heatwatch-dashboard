import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Database,
  Search,
} from "lucide-react";
import type { Dataset, Row } from "@/lib/dataset";
import { cityName, isHeatwave, severityOf, stateName } from "@/lib/dataset";
import { fmtDate, fmtInt, fmtNum } from "@/lib/format";
import { Card } from "./ui";

type SortKey =
  | "Record_ID"
  | "Date"
  | "Time"
  | "City"
  | "State"
  | "Max_Temp_C"
  | "Avg_Temp_C"
  | "Relative_Humidity"
  | "Heat_Index_C"
  | "Heatwave_Label"
  | "Heatwave_Severity";

interface Column {
  key: SortKey;
  label: string;
  align: "left" | "right";
}

const COLUMNS: Column[] = [
  { key: "Record_ID", label: "Record ID", align: "right" },
  { key: "Date", label: "Date", align: "left" },
  { key: "Time", label: "Time", align: "left" },
  { key: "City", label: "City", align: "left" },
  { key: "State", label: "State", align: "left" },
  { key: "Max_Temp_C", label: "Max Temp", align: "right" },
  { key: "Avg_Temp_C", label: "Avg Temp", align: "right" },
  { key: "Relative_Humidity", label: "Humidity", align: "right" },
  { key: "Heat_Index_C", label: "Heat Index", align: "right" },
  { key: "Heatwave_Label", label: "Status", align: "left" },
  { key: "Heatwave_Severity", label: "Severity", align: "left" },
];

const COLUMN_INDEX: Record<SortKey, number> = {
  Record_ID: 0,
  Date: 1,
  Time: 2,
  City: 5,
  State: 6,
  Max_Temp_C: 8,
  Avg_Temp_C: 10,
  Relative_Humidity: 11,
  Heat_Index_C: 17,
  Heatwave_Label: 18,
  Heatwave_Severity: 19,
};

const PAGE_SIZE = 25;

function cellValue(ds: Dataset, row: Row, key: SortKey): number | string {
  if (key === "City") return cityName(ds, row);
  if (key === "State") return stateName(ds, row);
  if (key === "Heatwave_Severity") return severityOf(ds, row) ?? "";
  const idx = COLUMN_INDEX[key];
  const v = row[idx];
  if (v === null || v === undefined) return "";
  return v as number | string;
}

function RowCells({
  row,
  hw,
  sev,
  ds,
}: {
  row: Row;
  hw: boolean;
  sev: string | null;
  ds: Dataset;
}) {
  return (
    <tr className="border-b border-slate-100 transition-colors odd:bg-white even:bg-slate-50/70 hover:bg-orange-50/60">
      <td className="px-3 py-2 text-right text-slate-500 tabular-nums">
        {fmtInt(row[0] as number)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-slate-700">
        {fmtDate(String(row[1]))}
      </td>
      <td className="px-3 py-2 text-slate-500">{row[2] as string}</td>
      <td className="px-3 py-2 font-semibold text-slate-800">{cityName(ds, row)}</td>
      <td className="px-3 py-2 text-slate-600">{stateName(ds, row)}</td>
      <td className="px-3 py-2 text-right font-medium text-slate-700 tabular-nums">
        {fmtNum(row[8] as number, 1)}
      </td>
      <td className="px-3 py-2 text-right text-slate-600 tabular-nums">
        {fmtNum(row[10] as number, 1)}
      </td>
      <td className="px-3 py-2 text-right text-slate-600 tabular-nums">
        {fmtNum(row[11] as number, 0)}%
      </td>
      <td
        className={`px-3 py-2 text-right font-semibold tabular-nums ${
          hw ? "text-red-600" : "text-slate-700"
        }`}
      >
        {fmtNum(row[17] as number, 1)}
      </td>
      <td className="px-3 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            hw ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {hw ? "Heatwave" : "Normal"}
        </span>
      </td>
      <td className="px-3 py-2">
        {sev ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              sev === "Extreme"
                ? "bg-red-600 text-white"
                : sev === "Severe"
                  ? "bg-orange-500 text-white"
                  : "bg-amber-400 text-amber-950"
            }`}
          >
            {sev}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
    </tr>
  );
}

export default function DataTable({ rows, ds }: { rows: Row[]; ds: Dataset }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("Record_ID");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      if (String(row[0]).includes(q)) return true;
      if (cityName(ds, row).toLowerCase().includes(q)) return true;
      if (stateName(ds, row).toLowerCase().includes(q)) return true;
      if (String(row[1]).toLowerCase().includes(q)) return true;
      return false;
    });
  }, [rows, ds, query]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const copy = [...searched];
    copy.sort((a, b) => {
      const va = cellValue(ds, a, sortKey);
      const vb = cellValue(ds, b, sortKey);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return copy;
  }, [searched, sortKey, sortDir, ds]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage]
  );

  useEffect(() => {
    setPage(1);
  }, [rows, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const start = sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, sorted.length);

  return (
    <Card
      title="Observation Records"
      subtitle="Paginated view of the filtered dataset — search, sort, 25 rows per page"
      icon={<Database className="h-4.5 w-4.5" aria-hidden="true" />}
      actions={
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            className="hw-input !pl-9"
            placeholder="Search ID, city, state, date…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search records"
          />
        </div>
      }
      bodyClassName="!px-0 !py-0"
    >
      <div className="hw-scroll max-h-[640px] overflow-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr>
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-orange-600 ${
                        active ? "text-orange-600" : ""
                      }`}
                    >
                      {col.label}
                      {active &&
                        (sortDir === "asc" ? (
                          <ArrowUp className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3 w-3" aria-hidden="true" />
                        ))}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const hw = isHeatwave(row);
              const sev = severityOf(ds, row);
              return (
                <RowCells key={row[0] as number} row={row} hw={hw} sev={sev} ds={ds} />
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-3 py-10 text-center text-sm text-slate-400"
                >
                  No records match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
        <p className="text-xs text-slate-500">
          Showing <b className="text-slate-700">{fmtInt(start)}</b>–
          <b className="text-slate-700">{fmtInt(end)}</b> of{" "}
          <b className="text-slate-700">{fmtInt(sorted.length)}</b> records
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Prev
          </button>
          <span className="text-xs font-semibold text-slate-600 tabular-nums">
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Card>
  );
}

