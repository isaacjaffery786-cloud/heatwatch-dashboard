import dynamic from "next/dynamic";
import { Map as MapIcon } from "lucide-react";
import type { GeoPoint } from "@/lib/analytics";
import { Card } from "./ui";

const GeoMap = dynamic(() => import("./GeoMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500">
      Loading interactive map…
    </div>
  ),
});

export default function GeoMapSection({ points }: { points: GeoPoint[] }) {
  return (
    <Card
      title="Geographical Monitoring"
      subtitle="City-level aggregation — one marker per monitored city"
      icon={<MapIcon className="h-4.5 w-4.5" aria-hidden="true" />}
      actions={
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
          {points.length} cities plotted
        </span>
      }
    >
      <GeoMap points={points} />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
        <span className="uppercase tracking-wider text-slate-400">Heatwave rate</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> &lt; 45%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 45–59%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> 60–74%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> ≥ 75%
        </span>
        <span className="text-slate-400">Marker size = heatwave events</span>
      </div>
    </Card>
  );
}
