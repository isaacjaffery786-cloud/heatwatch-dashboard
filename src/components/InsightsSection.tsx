import { useMemo } from "react";
import {
  Flame,
  Gauge,
  Lightbulb,
  Sparkles,
  Sun,
  Thermometer,
} from "lucide-react";
import type { CityRankingEntry, Dataset, Row } from "@/lib/analytics";
import { cityRanking, severityDistribution } from "@/lib/analytics";
import { isHeatwave } from "@/lib/dataset";
import { fmtInt, fmtNum, fmtPct } from "@/lib/format";
import { Card } from "./ui";

interface Insight {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}

/**
 * All insights are computed from the filtered rows — nothing is hardcoded.
 */
export default function InsightsSection({
  rows,
  ds,
}: {
  rows: Row[];
  ds: Dataset;
}) {
  const insights = useMemo<Insight[]>(() => {
    if (rows.length === 0) return [];

    const ranking = cityRanking(rows, ds);
    const heatwaveRows = rows.filter((r) => isHeatwave(r));

    // most heatwave-prone city = most heatwave events
    let prone: CityRankingEntry | null = null;
    for (const e of ranking) {
      if (!prone || e.heatwaveEvents > prone.heatwaveEvents) prone = e;
    }

    // highest average heat index city
    let hiCity: CityRankingEntry | null = null;
    for (const e of ranking) {
      if (!hiCity || e.avgHeatIndex > hiCity.avgHeatIndex) hiCity = e;
    }

    // highest recorded max temperature (single record)
    let maxTemp = Number.NEGATIVE_INFINITY;
    let maxTempRow: Row | null = null;
    let heatwaveCount = 0;
    for (const r of rows) {
      if (isHeatwave(r)) heatwaveCount += 1;
      const t = r[8] as number | null; // Max_Temp_C
      if (typeof t === "number" && t > maxTemp) {
        maxTemp = t;
        maxTempRow = r;
      }
    }

    // most common severity among heatwave records
    const sevSlices = severityDistribution(rows);
    const totalSev = sevSlices.reduce((s, x) => s + x.value, 0);
    const topSeverity = sevSlices.reduce(
      (best, x) => (x.value > best.value ? x : best),
      sevSlices[0] ?? { name: "—" as never, value: 0 }
    );

    const rate = (heatwaveCount / rows.length) * 100;

    const out: Insight[] = [];

    if (prone) {
      out.push({
        icon: <Flame className="h-4 w-4 text-red-500" aria-hidden="true" />,
        label: "Most heatwave-prone city",
        value: prone.city,
        detail: `${fmtInt(prone.heatwaveEvents)} heatwave events · ${fmtPct(prone.heatwaveRate, 1)} of its ${fmtInt(prone.records)} records`,
      });
    }

    if (hiCity) {
      out.push({
        icon: <Gauge className="h-4 w-4 text-orange-500" aria-hidden="true" />,
        label: "Highest average heat index",
        value: `${fmtNum(hiCity.avgHeatIndex, 1)} °C`,
        detail: `${hiCity.city}, ${hiCity.state} (mean Heat_Index_C)`,
      });
    }

    if (maxTempRow) {
      out.push({
        icon: <Thermometer className="h-4 w-4 text-amber-500" aria-hidden="true" />,
        label: "Highest recorded max temp",
        value: `${fmtNum(maxTemp, 1)} °C`,
        detail: `Record #${fmtInt(maxTempRow[0] as number)} · ${
          ds.dictionaries.City[maxTempRow[5] as number] ?? "—"
        } · ${maxTempRow[1] as string}`,
      });
    }

    if (totalSev > 0) {
      out.push({
        icon: <Sparkles className="h-4 w-4 text-red-600" aria-hidden="true" />,
        label: "Most common severity",
        value: topSeverity.name,
        detail: `${fmtInt(topSeverity.value)} records · ${fmtPct(
          (topSeverity.value / totalSev) * 100,
          1
        )} of classified heatwave records`,
      });
    }

    out.push({
      icon: <Sun className="h-4 w-4 text-sky-500" aria-hidden="true" />,
      label: "Heatwave percentage",
      value: fmtPct(rate, 2),
      detail: `${fmtInt(heatwaveCount)} of ${fmtInt(rows.length)} filtered records carry Heatwave_Label = 1`,
    });

    return out;
  }, [rows, ds]);

  if (insights.length === 0) {
    return (
      <Card
        title="Automated Insights"
        subtitle="Derived from the filtered dataset"
        icon={<Lightbulb className="h-4.5 w-4.5" aria-hidden="true" />}
      >
        <p className="py-8 text-center text-sm text-slate-500">
          No records available to derive insights.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Automated Insights"
      subtitle="Derived from the filtered dataset — every value computed from the records"
      icon={<Lightbulb className="h-4.5 w-4.5" aria-hidden="true" />}
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {insights.map((ins) => (
          <li
            key={ins.label}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
          >
            <div className="flex items-center gap-2">
              {ins.icon}
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {ins.label}
              </p>
            </div>
            <p className="mt-2 text-lg font-extrabold text-slate-900">{ins.value}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {ins.detail}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
