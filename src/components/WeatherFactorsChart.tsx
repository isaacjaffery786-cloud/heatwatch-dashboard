import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CloudSun } from "lucide-react";
import type { Row } from "@/lib/analytics";
import { weatherFactors } from "@/lib/analytics";
import { fmtNum } from "@/lib/format";
import { Card, tooltipStyle } from "./ui";

const GROUPS = [
  { key: "normal", label: "Normal", color: "#10b981" },
  { key: "heatwave", label: "Heatwave", color: "#ef4444" },
  { key: "moderate", label: "Moderate", color: "#f59e0b" },
  { key: "severe", label: "Severe", color: "#f97316" },
  { key: "extreme", label: "Extreme", color: "#dc2626" },
] as const;

type GroupKey = (typeof GROUPS)[number]["key"];

/**
 * Small-multiples: each factor keeps its own scale (units differ wildly —
 * solar radiation ~1000 W/m² vs rainfall ~mm), so five mini charts are used
 * instead of one misleading shared axis.
 */
export default function WeatherFactorsChart({ rows }: { rows: Row[] }) {
  const factors = useMemo(() => weatherFactors(rows), [rows]);

  return (
    <Card
      title="Weather Factors"
      subtitle="Average conditions: normal vs heatwave vs severity levels"
      icon={<CloudSun className="h-4.5 w-4.5" aria-hidden="true" />}
    >
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
        {factors.map((f) => {
          const data = GROUPS.map((g) => ({
            group: g.label,
            value: Number(f[g.key as GroupKey].toFixed(2)),
            color: g.color,
          }));
          const maxValue = Math.max(...data.map((d) => d.value), 0);
          return (
            <div key={f.factor} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <p className="text-xs font-bold text-slate-700">{f.factor}</p>
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  {f.unit}
                </span>
              </div>
              <p className="mb-1 text-[11px] text-slate-400">
                Peak observed: {fmtNum(f.max, 1)} {f.unit}
              </p>
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="group"
                      tick={{ fontSize: 9, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={{ stroke: "#cbd5e1" }}
                      interval={0}
                      angle={-32}
                      textAnchor="end"
                      height={44}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      domain={[0, (max: number) => Math.ceil(max * 1.15) || 1]}
                    />
                    <Tooltip
                      contentStyle={{ ...tooltipStyle, fontSize: 11 }}
                      cursor={{ fill: "rgba(148,163,184,0.15)" }}
                      formatter={(value: unknown) => [
                        `${fmtNum(Number(value), 2)} ${f.unit}`,
                        f.factor,
                      ]}
                      labelFormatter={(label: unknown) => `${String(label)} conditions`}
                    />
                    <Bar dataKey="value" isAnimationActive={false} radius={[4, 4, 0, 0]}>
                      {data.map((d) => (
                        <Cell key={d.group} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Every value is the arithmetic mean of the filtered records in that group.
      </p>
    </Card>
  );
}
