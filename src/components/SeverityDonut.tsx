import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import type { Row } from "@/lib/analytics";
import { severityDistribution } from "@/lib/analytics";
import { SEVERITIES, SEVERITY_COLORS } from "@/lib/dataset";
import { fmtInt, fmtPct } from "@/lib/format";
import { Card, tooltipStyle } from "./ui";

export default function SeverityDonut({ rows }: { rows: Row[] }) {
  const data = useMemo(
    () => severityDistribution(rows).filter((d) => d.value > 0),
    [rows]
  );
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card
      title="Severity Distribution"
      subtitle="Moderate / Severe / Extreme share of heatwave records"
      icon={<PieChartIcon className="h-4.5 w-4.5" aria-hidden="true" />}
    >
      {total === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-semibold text-slate-500">No severity data</p>
          <p className="text-xs text-slate-400">
            The current filters contain no heatwave severity records.
          </p>
        </div>
      ) : (
        <div className="relative h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="85%"
                paddingAngle={3}
                stroke="#ffffff"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: unknown, name: unknown) => [
                  `${fmtInt(Number(value))} records (${fmtPct((Number(value) / total) * 100, 1)})`,
                  String(name),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {fmtInt(total)}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Heatwave records
            </span>
            <span className="mt-1 flex gap-1.5">
              {SEVERITIES.map((s) => (
                <span
                  key={s}
                  className="h-1.5 w-6 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLORS[s] }}
                />
              ))}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
