import {
  Building2,
  Flame,
  Percent,
  Rows3,
  Sun,
  Thermometer,
} from "lucide-react";
import type { Kpis } from "@/lib/analytics";
import { fmtInt, fmtNum, fmtPct } from "@/lib/format";

interface KpiDef {
  key: keyof Kpis;
  label: string;
  icon: React.ReactNode;
  accent: string; // tailwind classes for icon chip + value
  format: (v: number) => string;
  hint: string;
}

const KPIS: KpiDef[] = [
  {
    key: "total",
    label: "Total Records",
    icon: <Rows3 className="h-4.5 w-4.5" aria-hidden="true" />,
    accent: "bg-sky-50 text-sky-600",
    format: fmtInt,
    hint: "In current filter",
  },
  {
    key: "heatwaveEvents",
    label: "Heatwave Events",
    icon: <Flame className="h-4.5 w-4.5" aria-hidden="true" />,
    accent: "bg-red-50 text-red-600",
    format: fmtInt,
    hint: "Label = 1 records",
  },
  {
    key: "heatwaveRate",
    label: "Heatwave Rate",
    icon: <Percent className="h-4.5 w-4.5" aria-hidden="true" />,
    accent: "bg-orange-50 text-orange-600",
    format: (v) => fmtPct(v, 2),
    hint: "Share of filtered records",
  },
  {
    key: "cities",
    label: "Cities Monitored",
    icon: <Building2 className="h-4.5 w-4.5" aria-hidden="true" />,
    accent: "bg-teal-50 text-teal-600",
    format: fmtInt,
    hint: "Distinct cities in filter",
  },
  {
    key: "avgMaxTemp",
    label: "Avg Max Temperature",
    icon: <Thermometer className="h-4.5 w-4.5" aria-hidden="true" />,
    accent: "bg-amber-50 text-amber-600",
    format: (v) => `${fmtNum(v, 1)} °C`,
    hint: "Mean of Max_Temp_C",
  },
  {
    key: "maxHeatIndex",
    label: "Highest Heat Index",
    icon: <Sun className="h-4.5 w-4.5" aria-hidden="true" />,
    accent: "bg-rose-50 text-rose-600",
    format: (v) => `${fmtNum(v, 1)} °C`,
    hint: "Peak Heat_Index_C",
  },
];

export default function KpiCards({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {KPIS.map((def) => (
        <article key={def.key} className="hw-card px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {def.label}
            </p>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${def.accent}`}
            >
              {def.icon}
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {def.format(kpis[def.key])}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{def.hint}</p>
        </article>
      ))}
    </div>
  );
}
