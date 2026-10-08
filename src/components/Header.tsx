import { Activity, Flame } from "lucide-react";

export default function Header({ recordCount }: { recordCount: number | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 shadow-lg shadow-orange-600/30">
            <Flame className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-[0.18em] text-white sm:text-2xl">
              HEATWATCH
            </h1>
            <p className="text-xs font-medium text-slate-400 sm:text-sm">
              Heatwave Monitoring &amp; Early Warning System
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {recordCount !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-300">
              <Activity className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
              {recordCount.toLocaleString("en-US")} records loaded
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
            <span className="hw-live-dot h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            Live Dataset Monitoring
          </span>
        </div>
      </div>
    </header>
  );
}
