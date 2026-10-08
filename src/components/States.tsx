import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-10 text-center">
      <Loader2 className="h-9 w-9 animate-spin text-orange-400" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-slate-200">{message}</p>
        <p className="mt-1 text-xs text-slate-500">
          Parsing the preprocessed 50,000-record dataset…
        </p>
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/30 bg-red-950/30 p-10 text-center">
      <AlertTriangle className="h-9 w-9 text-red-400" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-red-200">Dataset failed to load</p>
        <p className="mt-1 max-w-md text-xs text-red-300/80">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
      >
        Retry
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[35vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-600 bg-slate-900/40 p-10 text-center">
      <Inbox className="h-9 w-9 text-slate-500" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      </div>
      {action}
    </div>
  );
}
