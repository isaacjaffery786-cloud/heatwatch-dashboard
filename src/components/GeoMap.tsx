import { useMemo } from "react";
import {
  MapContainer,
  CircleMarker,
  Popup,
  TileLayer,
  Tooltip as LeafletTooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Dataset, GeoPoint } from "@/lib/analytics";
import { fmtInt, fmtNum, fmtPct } from "@/lib/format";

function riskColor(rate: number): string {
  if (rate >= 75) return "#dc2626";
  if (rate >= 60) return "#f97316";
  if (rate >= 45) return "#f59e0b";
  return "#10b981";
}

export default function GeoMap({ points }: { points: GeoPoint[] }) {
  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) return [22.5, 79.5];
    const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const lon = points.reduce((s, p) => s + p.lon, 0) / points.length;
    return [lat, lon];
  }, [points]);

  const maxEvents = useMemo(
    () => Math.max(1, ...points.map((p) => p.heatwaveEvents)),
    [points]
  );

  if (points.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No cities match the current filters.
      </div>
    );
  }

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => {
          const radius = 9 + (p.heatwaveEvents / maxEvents) * 16;
          return (
            <CircleMarker
              key={p.city}
              center={[p.lat, p.lon]}
              radius={radius}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: riskColor(p.heatwaveRate),
                fillOpacity: 0.85,
              }}
            >
              <LeafletTooltip direction="top" opacity={0.95}>
                <span className="text-xs font-semibold">
                  {p.city} — {fmtPct(p.heatwaveRate, 1)} heatwave rate
                </span>
              </LeafletTooltip>
              <Popup>
                <div style={{ minWidth: 210, fontSize: 12, lineHeight: 1.55 }}>
                  <strong style={{ fontSize: 14 }}>{p.city}</strong>
                  <div style={{ color: "#64748b" }}>
                    {p.state}, {p.country}
                  </div>
                  <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
                  <div>Records: <b>{fmtInt(p.records)}</b></div>
                  <div>Heatwave events: <b>{fmtInt(p.heatwaveEvents)}</b></div>
                  <div>Heatwave rate: <b>{fmtPct(p.heatwaveRate, 1)}</b></div>
                  <div>Avg heat index: <b>{fmtNum(p.avgHeatIndex, 1)} °C</b></div>
                  <div>Avg max temp: <b>{fmtNum(p.avgMaxTemp, 1)} °C</b></div>
                  <div>
                    Peak severity:{" "}
                    <b style={{ color: p.maxSeverity === "Extreme" ? "#dc2626" : p.maxSeverity === "Severe" ? "#f97316" : "#f59e0b" }}>
                      {p.maxSeverity ?? "None"}
                    </b>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export function MapLegend() {
  const items = [
    { color: "#10b981", label: "Rate < 45%" },
    { color: "#f59e0b", label: "45 – 59%" },
    { color: "#f97316", label: "60 – 74%" },
    { color: "#dc2626", label: "≥ 75%" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-900/90 px-3 py-2 text-[11px] font-semibold text-slate-300">
      <span className="uppercase tracking-wider text-slate-400">Heatwave rate</span>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i.color }} />
          {i.label}
        </span>
      ))}
      <span className="text-slate-500">Marker size = heatwave events</span>
    </div>
  );
}

export type { Dataset };
