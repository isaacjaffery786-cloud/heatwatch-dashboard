import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ScatterChart as ScatterIcon } from "lucide-react";
import type { Dataset, Row } from "@/lib/analytics";
import { scatterSample } from "@/lib/analytics";
import { fmtInt, fmtNum } from "@/lib/format";
import { Card, tooltipStyle } from "./ui";

interface Point {
  avgTemp: number;
  heatIndex: number;
  city: string;
  severity: string;
}

export default function TempVsHeatIndexScatter({
  rows,
  ds,
}: {
  rows: Row[];
  ds: Dataset;
}) {
  const points = useMemo(() => scatterSample(rows, ds, 800), [rows, ds]);

  const heatwave = useMemo(
    () => points.filter((p) => p.severity !== "Non-heatwave"),
    [points]
  );
  const normal = useMemo(
    () => points.filter((p) => p.severity === "Non-heatwave"),
    [points]
  );

  return (
    <Card
      title="Temperature vs Heat Index"
      subtitle={`Avg_Temp_C vs Heat_Index_C · ${fmtInt(points.length)} sampled records`}
      icon={<ScatterIcon className="h-4.5 w-4.5" aria-hidden="true" />}
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="avgTemp"
              name="Avg Temp"
              unit="°C"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              label={{
                value: "Average Temperature (°C)",
                position: "insideBottom",
                offset: -4,
                fontSize: 11,
                fill: "#64748b",
              }}
            />
            <YAxis
              type="number"
              dataKey="heatIndex"
              name="Heat Index"
              unit="°C"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              width={58}
              label={{
                value: "Heat Index (°C)",
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
                fill: "#64748b",
              }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ strokeDasharray: "3 3", stroke: "#94a3b8" }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const p = payload[0].payload as Point;
                return (
                  <div style={tooltipStyle}>
                    <p style={{ fontWeight: 700, marginBottom: 4 }}>
                      {p.city} · {p.severity}
                    </p>
                    <p>Avg Temp: {fmtNum(p.avgTemp, 1)} °C</p>
                    <p>Heat Index: {fmtNum(p.heatIndex, 1)} °C</p>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Scatter
              name="Heatwave records"
              data={heatwave}
              fill="#ef4444"
              fillOpacity={0.55}
              isAnimationActive={false}
            />
            <Scatter
              name="Non-heatwave records"
              data={normal}
              fill="#10b981"
              fillOpacity={0.5}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">
        Evenly-strided sample of the filtered records to keep the chart responsive.
      </p>
    </Card>
  );
}
