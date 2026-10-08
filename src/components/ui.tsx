import type { ReactNode } from "react";

/** Light dashboard card on the dark navy background. */
export function Card({
  title,
  subtitle,
  icon,
  actions,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`hw-card flex flex-col ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-orange-400">
              {icon}
            </span>
          )}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
      <div className={`flex-1 px-4 py-4 sm:px-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** Small segmented control used for chart toggles (grain, metric…). */
export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      className="inline-flex rounded-[0.65rem] bg-slate-100 p-1"
      role="group"
      aria-label={label}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="hw-toggle"
          data-active={value === opt.value}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Shared Recharts tooltip styling for light cards. */
export const tooltipStyle: React.CSSProperties = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "0.6rem",
  padding: "8px 10px",
  fontSize: 12,
  color: "#e2e8f0",
  boxShadow: "0 8px 24px rgba(2,6,23,0.35)",
};
