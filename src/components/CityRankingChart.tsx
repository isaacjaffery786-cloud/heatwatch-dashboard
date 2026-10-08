import { useMemo, useState } from "react";
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
import { BarChart3 } from "lucide-react";
import type { CityMetric, Dataset, Row } from "@/lib/analytics";
import { cityRanking, sortCitiesBy } from "@/lib/analytics";
import { fmtInt, fmtNum } from "@/lib/format";
import { Card, ToggleGroup, tooltipStyle } from "./ui";

const METRIC_LABEL: Record<CityMetric, string> = {
  heatwaveEvents: "Heatwave Events",
  avgHeatIndex: "Avg Heat Index",
  avgMaxTemp: "Avg Max Temp",
};

const METRIC_COLOR: Record<CityMetric, string> = {
  heatwaveEvents: "#ef4444",
  avgHeatIndex: "#f97316",
  avgMaxTemp: "#f59e0b",
};

export default function CityRankingChart({
  rows,
  ds,
}: {
  rows: Row[];
  ds: Dataset;
}) {
  const [metric, setMetric] = useState<CityMetric>("heatwaveEvents");

  const ranked = useMemo(
    () => sortCitiesBy(cityRanking(rows, ds), metric),
    [rows, ds, metric]
  );

  const color = METRIC_COLOR[metric];

  const formatValue = (v: number) =>
    metric === "heatwaveEvents" ? fmtInt(v) : fmtNum(v, 1);

  return (
    <Card
      title="City Risk Ranking"
      subtitle={`Cities ranked by ${METRIC_LABEL[metric].toLowerCase()}`}
      icon={<BarChart3 className="h-4.5 w-4.5" aria-hidden="true" />}
      actions={
        <ToggleGroup<CityMetric>
          label="Ranking metric"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "heatwaveEvents", label: "Heatwave Events" },
            { value: "avgHeatIndex", label: "Avg Heat Index" },
            { value: "avgMaxTemp", label: "Avg Max Temp" },
          ]}
        />
      }
    >
      <div className="h-[330px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ranked}
            layout="vertical"
            margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              type="category"
              dataKey="city"
              tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              width={96}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "rgba(148,163,184,0.12)" }}
              formatter={(value: unknown) => [formatValue(Number(value)), METRIC_LABEL[metric]]}
              labelFormatter={(label: unknown) => {
                const entry = ranked.find((r) => r.city === String(label));
                return entry ? `${entry.city}, ${entry.state}` : String(label);
              }}
            />
            <Bar dataKey={metric} isAnimationActive={false} radius={[0, 6, 6, 0]}>
              {ranked.map((entry) => (
                <Cell key={entry.city} fill={color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">
        Source: filtered records ·{" "}
        {ranked.reduce((s, r) => s + r.heatwaveEvents, 0).toLocaleString("en-US")}{" "}
        heatwave events across {ranked.length} cities
      </p>
    </Card>
  );
}
