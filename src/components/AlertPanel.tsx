import { useMemo } from "react";
import { AlertOctagon, Flame, MapPin, TrendingUp } from "lucide-react";
import type { CityRankingEntry, Dataset, Row } from "@/lib/analytics";
import { cityRanking } from "@/lib/analytics";
import { SEVERITY_COLORS, isHeatwave, severityOf, type Severity } from "@/lib/dataset";
import { fmtInt, fmtNum, fmtPct } from "@/lib/format";
import { Card } from "./ui";

interface AlertItem extends CityRankingEntry {
  topSeverity: Severity | null;
}

const SEV_RANK: Record<Severity, number> = { Moderate: 0, Severe: 1, Extreme: 2 };

function severityBadge(sev: Severity | null) {
  if (!sev) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        No peak
      </span>
    );
  }
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
      style={{ backgroundColor: SEVERITY_COLORS[sev] }}
    >
      {sev} peak
    </span>
  );
}

/**
 * "Heatwave Alert Center": highest-risk cities derived from the filtered
 * heatwave records — ranked by heatwave events, with average heat index,
 * rate, peak severity and peak heat index per city.
 */
export default function AlertPanel({ rows, ds }: { rows: Row[]; ds: Dataset }) {
  const alerts = useMemo<AlertItem[]>(() => {
    const heatwaveRows = rows.filter((r) => isHeatwave(r));
    if (heatwaveRows.length === 0) return [];

    const base = cityRanking(heatwaveRows, ds);

    const peak = new Map<string, Severity | null>();
    for (const row of heatwaveRows) {
      const sev = severityOf(ds, row);
      if (!sev) continue;
      const city = ds.dictionaries.City[row[5] as number] ?? "Unknown";
      const current = peak.get(city) ?? null;
      if (!current || SEV_RANK[sev] > SEV_RANK[current]) peak.set(city, sev);
    }

    return base
      .map((e) => ({ ...e, topSeverity: peak.get(e.city) ?? null }))
      .sort((a, b) => b.heatwaveEvents - a.heatwaveEvents)
      .slice(0, 6);
  }, [rows, ds]);

  if (alerts.length === 0) {
    return (
      <Card
        title="Heatwave Alert Center"
        subtitle="Highest-risk cities in the current filter"
        icon={<AlertOctagon className="h-4.5 w-4.5" aria-hidden="true" />}
      >
        <p className="py-8 text-center text-sm text-slate-500">
          No heatwave alerts for the current filters.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Heatwave Alert Center"
      subtitle="Highest-risk cities ranked by heatwave events in the current filter"
      icon={<AlertOctagon className="h-4.5 w-4.5 text-red-500" aria-hidden="true" />}
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
          <Flame className="h-3.5 w-3.5" aria-hidden="true" />
          {alerts.length} top-risk cities
        </span>
      }
    >
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {alerts.map((a, i) => (
          <li
            key={a.city}
            className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-extrabold text-orange-400">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{a.city}</p>
                  <p className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {a.state}
                  </p>
                </div>
              </div>
              {severityBadge(a.topSeverity)}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-red-50 px-1 py-2">
                <p className="text-sm font-extrabold text-red-600 tabular-nums">
                  {fmtInt(a.heatwaveEvents)}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-red-400">
                  HW events
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 px-1 py-2">
                <p className="text-sm font-extrabold text-orange-600 tabular-nums">
                  {fmtNum(a.avgHeatIndex, 1)}°
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-orange-400">
                  Avg HI
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 px-1 py-2">
                <p className="text-sm font-extrabold text-amber-600 tabular-nums">
                  {fmtPct(a.heatwaveRate, 0)}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-amber-500">
                  Rate
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                Peak {fmtNum(a.maxHeatIndex, 1)} °C
              </span>
              <span>{fmtInt(a.records)} records</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
