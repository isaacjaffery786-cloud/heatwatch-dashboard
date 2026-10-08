import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { Grain, Row } from "@/lib/analytics";
import { heatwaveTrend } from "@/lib/analytics";
import { fmtInt, fmtMonth, fmtPct } from "@/lib/format";
import { Card, ToggleGroup, tooltipStyle } from "./ui";

export default function HeatwaveTrendChart({ rows }: { rows: Row[] }) {
  const [grain, setGrain] = useState<Grain>("month");

  const data = useMemo(() => heatwaveTrend(rows, grain), [rows, grain]);

  const tickFormatter = (v: string) =>
    grain === "month" ? fmtMonth(v) : grain === "year" ? v : v;

  return (
    <Card
      title="Heatwave Trend"
      subtitle={`Heatwave activity by ${grain} · ${fmtInt(data.length)} buckets`}
      icon={<TrendingUp className="h-4.5 w-4.5" aria-hidden="true" />}
      actions={
        <ToggleGroup<Grain>
          label="Trend granularity"
          value={grain}
          onChange={setGrain}
          options={[
            { value: "day", label: "Day" },
            { value: "month", label: "Month" },
            { value: "year", label: "Year" },
          ]}
        />
      }
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="hwArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="key"
              tickFormatter={tickFormatter}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              minTickGap={34}
            />
            <YAxis
              yAxisId="count"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={52}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={46}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(label: unknown) =>
                grain === "month" ? fmtMonth(String(label)) : String(label)
              }
              formatter={(value: unknown, name: unknown) => {
                if (name === "Heatwave Rate") return [fmtPct(Number(value), 1), String(name)];
                return [fmtInt(Number(value)), String(name)];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              yAxisId="count"
              type="monotone"
              dataKey="heatwaveEvents"
              name="Heatwave Events"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#hwArea)"
              isAnimationActive={false}
            />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="heatwaveRate"
              name="Heatwave Rate"
              stroke="#f59e0b"
              strokeWidth={1.8}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
