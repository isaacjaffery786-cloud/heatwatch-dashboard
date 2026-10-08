import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Thermometer } from "lucide-react";
import type { Grain, Row } from "@/lib/analytics";
import { temperatureTrend } from "@/lib/analytics";
import { fmtInt, fmtMonth, fmtNum } from "@/lib/format";
import { Card, ToggleGroup, tooltipStyle } from "./ui";

export default function TemperatureTrendChart({ rows }: { rows: Row[] }) {
  const [grain, setGrain] = useState<Grain>("month");

  const data = useMemo(() => temperatureTrend(rows, grain), [rows, grain]);

  return (
    <Card
      title="Temperature Trend"
      subtitle={`Average max / avg temperature by ${grain} · ${fmtInt(data.length)} buckets`}
      icon={<Thermometer className="h-4.5 w-4.5" aria-hidden="true" />}
      actions={
        <ToggleGroup<Grain>
          label="Temperature granularity"
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
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="key"
              tickFormatter={(v: string) => (grain === "month" ? fmtMonth(v) : v)}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              minTickGap={34}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              width={52}
              unit="°"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(label: unknown) =>
                grain === "month" ? fmtMonth(String(label)) : String(label)
              }
              formatter={(value: unknown, name: unknown) => [
                `${fmtNum(Number(value), 1)} °C`,
                String(name),
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="avgMaxTemp"
              name="Avg Max Temp"
              stroke="#ef4444"
              strokeWidth={2.2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="avgTemp"
              name="Avg Temp"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
